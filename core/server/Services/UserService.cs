using Microsoft.EntityFrameworkCore;
using Server.Config;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface IUserService
{
    Task<PagedResult<UsuarioDto>> ListAsync(int page, int pageSize, string? search, string? role, CancellationToken ct);
    Task<UsuarioDto?> GetAsync(int id, CancellationToken ct);
    Task<(UsuarioDto? User, string? Error)> CreateAsync(UsuarioInput input, string? actor, CancellationToken ct);
    /// <summary>User y Error nulos = no existe.</summary>
    Task<(UsuarioDto? User, string? Error)> UpdateAsync(int id, UsuarioInput input, string? actor, CancellationToken ct);
    /// <summary>Found falso = no existe.</summary>
    Task<(bool Found, string? Error)> DeactivateAsync(int id, string? actor, CancellationToken ct);
}

public sealed class UserService(AppDbContext db, IAuditService audit) : IUserService
{
    private static UsuarioDto ToDto(User u) =>
        new(u.Id, u.Email, u.Name, u.Role, u.Activo,
            u.HoraEntrada.ToString("HH:mm"), u.LastLoginAt, u.CreatedAt);

    private static TimeOnly? ParseHora(string? value) =>
        TimeOnly.TryParse(value, out var t) ? t : null;

    private const string ErrorRol = "Rol inválido. Usa: admin, ventas, operaciones o gerencia.";
    private const string ErrorUltimoAdmin = "Debe quedar al menos un administrador activo.";

    private Task<bool> HayOtroAdminActivoAsync(int exceptoId, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Id != exceptoId && u.Activo && u.Role == Roles.Admin, ct);

    public async Task<PagedResult<UsuarioDto>> ListAsync(int page, int pageSize, string? search, string? role, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<User> q = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Email.Contains(search) || u.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(role))
            q = q.Where(u => u.Role == role);

        int total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(u => u.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<UsuarioDto>(total, page, pageSize, rows.Select(ToDto).ToList());
    }

    public async Task<UsuarioDto?> GetAsync(int id, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return u is null ? null : ToDto(u);
    }

    public async Task<(UsuarioDto? User, string? Error)> CreateAsync(UsuarioInput input, string? actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Email) || string.IsNullOrWhiteSpace(input.Name))
            return (null, "Email y nombre son obligatorios.");
        if (string.IsNullOrWhiteSpace(input.Password))
            return (null, "La contraseña es obligatoria al crear.");
        if (!Roles.EsValido(input.Role))
            return (null, ErrorRol);

        string email = input.Email.Trim();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return (null, "Ya existe un usuario con ese correo.");

        var user = new User
        {
            Email = email,
            Name = input.Name.Trim(),
            Role = input.Role!.Trim().ToLowerInvariant(),
            Activo = input.Activo ?? true,
            HoraEntrada = ParseHora(input.HoraEntrada) ?? new TimeOnly(9, 0),
            PasswordHash = PasswordHasher.Hash(input.Password),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Crear", nameof(User), user.Id, ct: ct);
        return (ToDto(user), null);
    }

    public async Task<(UsuarioDto? User, string? Error)> UpdateAsync(int id, UsuarioInput input, string? actor, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([id], ct);
        if (user is null) return (null, null);

        string? nuevoRol = string.IsNullOrWhiteSpace(input.Role) ? null : input.Role.Trim().ToLowerInvariant();
        if (nuevoRol is not null && !Roles.EsValido(nuevoRol)) return (null, ErrorRol);

        bool dejaDeSerAdminActivo = Roles.Es(user.Role, Roles.Admin) && user.Activo
            && ((nuevoRol is not null && nuevoRol != Roles.Admin) || input.Activo == false);
        if (dejaDeSerAdminActivo && !await HayOtroAdminActivoAsync(user.Id, ct))
            return (null, ErrorUltimoAdmin);

        if (!string.IsNullOrWhiteSpace(input.Email)) user.Email = input.Email.Trim();
        if (!string.IsNullOrWhiteSpace(input.Name)) user.Name = input.Name.Trim();
        if (nuevoRol is not null) user.Role = nuevoRol;
        if (input.Activo.HasValue) user.Activo = input.Activo.Value;
        if (ParseHora(input.HoraEntrada) is TimeOnly hora) user.HoraEntrada = hora;
        if (!string.IsNullOrWhiteSpace(input.Password)) user.PasswordHash = PasswordHasher.Hash(input.Password);

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Actualizar", nameof(User), id, ct: ct);
        return (ToDto(user), null);
    }

    public async Task<(bool Found, string? Error)> DeactivateAsync(int id, string? actor, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([id], ct);
        if (user is null) return (false, null);

        if (Roles.Es(user.Role, Roles.Admin) && user.Activo && !await HayOtroAdminActivoAsync(user.Id, ct))
            return (true, ErrorUltimoAdmin);

        user.Activo = false; // baja lógica
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Desactivar", nameof(User), id, ct: ct);
        return (true, null);
    }
}
