using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface ISolicitudService
{
    Task<(Solicitud? Solicitud, string? Error)> CreateFromPublicAsync(SolicitudPublicInput input, CancellationToken ct);
    Task<PagedResult<Solicitud>> ListAsync(int page, int pageSize, string? tipo, string? estado, string? search, CancellationToken ct);
    Task<Solicitud?> GetAsync(int id, CancellationToken ct);
    Task<(Solicitud? Solicitud, string? Error)> CambiarEstadoAsync(int id, SolicitudEstadoInput input, string? actor, CancellationToken ct);
    Task<(Cliente? Cliente, string? Error)> ConvertirEnClienteAsync(int id, string? actor, CancellationToken ct);
    Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct);
}

public sealed class SolicitudService(AppDbContext db, IAuditService audit) : ISolicitudService
{
    private static readonly string[] Tipos = ["Cotizacion", "Contacto"];
    private static readonly string[] Estados = ["Nueva", "Atendida", "Convertida", "Descartada"];

    public async Task<(Solicitud?, string?)> CreateFromPublicAsync(SolicitudPublicInput input, CancellationToken ct)
    {
        string nombre = (input.Nombre ?? string.Empty).Trim();
        if (nombre.Length < 2)
            return (null, "El nombre es obligatorio.");
        if (string.IsNullOrWhiteSpace(input.Email) && string.IsNullOrWhiteSpace(input.Telefono))
            return (null, "Indica un correo o un teléfono de contacto.");

        var sol = new Solicitud
        {
            Tipo = Tipos.Contains(input.Tipo) ? input.Tipo! : "Cotizacion",
            Nombre = Clip(nombre, 200)!,
            Empresa = Clip(input.Empresa, 200),
            Email = Clip(input.Email, 256),
            Telefono = Clip(input.Telefono, 60),
            Mensaje = Clip(input.Mensaje, 2000),
            ProductoNombre = Clip(input.ProductoNombre, 200),
            Categoria = Clip(input.Categoria, 120),
            Direccion = Clip(input.Direccion, 300),
            Ciudad = Clip(input.Ciudad, 120),
            CodigoPostal = Clip(input.CodigoPostal, 20),
            Estado = "Nueva",
            Origen = "Web",
        };

        db.Solicitudes.Add(sol);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("web", "Recibir", nameof(Solicitud), sol.Id, $"{sol.Tipo}: {sol.Nombre}", ct);
        return (sol, null);
    }

    public async Task<PagedResult<Solicitud>> ListAsync(
        int page, int pageSize, string? tipo, string? estado, string? search, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<Solicitud> q = db.Solicitudes.AsNoTracking().Include(s => s.Cliente);

        if (!string.IsNullOrWhiteSpace(tipo)) q = q.Where(s => s.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(estado)) q = q.Where(s => s.Estado == estado);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(s => s.Nombre.Contains(search)
                || (s.Empresa != null && s.Empresa.Contains(search))
                || (s.Email != null && s.Email.Contains(search)));

        int total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(s => s.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Solicitud>(total, page, pageSize, items);
    }

    public Task<Solicitud?> GetAsync(int id, CancellationToken ct) =>
        db.Solicitudes.AsNoTracking().Include(s => s.Cliente).FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<(Solicitud?, string?)> CambiarEstadoAsync(
        int id, SolicitudEstadoInput input, string? actor, CancellationToken ct)
    {
        if (!Estados.Contains(input.Estado))
            return (null, $"Estado inválido: {input.Estado}.");

        var sol = await db.Solicitudes.FindAsync([id], ct);
        if (sol is null) return (null, null);

        sol.Estado = input.Estado;
        if (input.Notas is not null) sol.Notas = Clip(input.Notas, 1000);
        if (input.Estado != "Nueva") sol.AtendidaAt ??= DateTimeOffset.UtcNow;
        sol.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Estado", nameof(Solicitud), id, input.Estado, ct);
        return (await GetAsync(id, ct), null);
    }

    public async Task<(Cliente?, string?)> ConvertirEnClienteAsync(int id, string? actor, CancellationToken ct)
    {
        var sol = await db.Solicitudes.FindAsync([id], ct);
        if (sol is null) return (null, null);

        if (sol.ClienteId is int ya)
            return (await db.Clientes.FindAsync([ya], ct), null);

        // Reutiliza un cliente existente con el mismo correo si lo hubiera.
        Cliente? cliente = null;
        if (!string.IsNullOrWhiteSpace(sol.Email))
            cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Email == sol.Email, ct);

        if (cliente is null)
        {
            cliente = new Cliente
            {
                Nombre = string.IsNullOrWhiteSpace(sol.Empresa) ? sol.Nombre : sol.Empresa!,
                RazonSocial = sol.Empresa,
                Contacto = sol.Nombre,
                Email = sol.Email,
                Telefono = sol.Telefono,
                Direccion = sol.Direccion,
                Ciudad = sol.Ciudad,
                Estado = "Prospecto",
                Etapa = "Contacto Inicial-1",
                MedioContacto = "Web",
                Rubro = sol.Categoria,
                Notas = sol.Mensaje,
            };
            db.Clientes.Add(cliente);
            await db.SaveChangesAsync(ct);
        }

        sol.ClienteId = cliente.Id;
        sol.Estado = "Convertida";
        sol.AtendidaAt ??= DateTimeOffset.UtcNow;
        sol.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await audit.LogAsync(actor, "Convertir", nameof(Solicitud), id, $"Cliente #{cliente.Id}", ct);
        return (cliente, null);
    }

    public async Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct)
    {
        var sol = await db.Solicitudes.FindAsync([id], ct);
        if (sol is null) return false;
        db.Solicitudes.Remove(sol);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Eliminar", nameof(Solicitud), id, ct: ct);
        return true;
    }

    private static string? Clip(string? value, int max)
    {
        value = value?.Trim();
        if (string.IsNullOrEmpty(value)) return null;
        return value.Length <= max ? value : value[..max];
    }
}
