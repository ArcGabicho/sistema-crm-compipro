using Server.Config;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface IAttendanceService
{
    Task<CheckInResult?> CheckInAsync(int userId, CancellationToken ct);
    Task<PagedResult<RegistroAsistencia>> ListAsync(
        int page, int pageSize, int? userId, DateOnly? desde, DateOnly? hasta, bool soloTarde, CancellationToken ct);
    Task<RegistroAsistencia?> GetAsync(int id, CancellationToken ct);
    Task<(RegistroAsistencia? Registro, string? Error)> JustifyAsync(
        int id, string? texto, int actorUserId, string? actorRole, string? actorEmail, CancellationToken ct);
}

public sealed class AttendanceService(AppDbContext db, IAuditService audit) : IAttendanceService
{
    /// <summary>Minutos de gracia antes de considerar que un ingreso es tardanza.</summary>
    private const int ToleranciaMinutos = 5;

    // Perú no aplica horario de verano: UTC-5 fijo.
    private static DateTime NowLima() => DateTime.UtcNow.AddHours(-5);

    public async Task<CheckInResult?> CheckInAsync(int userId, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return null;

        var ahora = NowLima();
        var hoy = DateOnly.FromDateTime(ahora);
        var horaIngreso = TimeOnly.FromDateTime(ahora);

        var existente = await db.RegistrosAsistencia
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Fecha == hoy, ct);

        if (existente is not null)
            return ToResult(existente, yaRegistrada: true);

        // Desviación respecto a la hora de entrada: positiva = retraso, negativa = adelanto.
        int desviacion = (int)Math.Round(
            (horaIngreso.ToTimeSpan() - user.HoraEntrada.ToTimeSpan()).TotalMinutes);
        int tardanza = Math.Max(0, desviacion);
        int anticipacion = Math.Max(0, -desviacion);
        bool tarde = tardanza > ToleranciaMinutos;
        string estado = tarde
            ? "Tarde"
            : anticipacion > ToleranciaMinutos ? "Temprano" : "ATiempo";

        var registro = new RegistroAsistencia
        {
            UserId = userId,
            Fecha = hoy,
            HoraProgramada = user.HoraEntrada,
            HoraIngreso = horaIngreso,
            MinutosTardanza = tardanza,
            MinutosAnticipacion = anticipacion,
            Tarde = tarde,
            Estado = estado,
        };
        db.RegistrosAsistencia.Add(registro);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(user.Email, "Ingreso", nameof(RegistroAsistencia), registro.Id,
            tarde ? $"Tarde {tardanza} min" : estado, ct);

        return ToResult(registro, yaRegistrada: false);
    }

    public async Task<PagedResult<RegistroAsistencia>> ListAsync(
        int page, int pageSize, int? userId, DateOnly? desde, DateOnly? hasta, bool soloTarde, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<RegistroAsistencia> q = db.RegistrosAsistencia.AsNoTracking().Include(r => r.User);
        if (userId is int uid) q = q.Where(r => r.UserId == uid);
        if (desde is DateOnly d) q = q.Where(r => r.Fecha >= d);
        if (hasta is DateOnly h) q = q.Where(r => r.Fecha <= h);
        if (soloTarde) q = q.Where(r => r.Tarde);

        int total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(r => r.Fecha).ThenByDescending(r => r.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<RegistroAsistencia>(total, page, pageSize, items);
    }

    public Task<RegistroAsistencia?> GetAsync(int id, CancellationToken ct) =>
        db.RegistrosAsistencia.AsNoTracking().Include(r => r.User).FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<(RegistroAsistencia?, string?)> JustifyAsync(
        int id, string? texto, int actorUserId, string? actorRole, string? actorEmail, CancellationToken ct)
    {
        var registro = await db.RegistrosAsistencia.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (registro is null) return (null, null);

        bool esAdmin = Roles.Es(actorRole, Roles.Admin);
        if (registro.UserId != actorUserId && !esAdmin)
            return (null, "Solo puedes justificar tus propias tardanzas.");
        if (!registro.Tarde)
            return (null, "Este ingreso no registra tardanza.");

        string limpio = (texto ?? string.Empty).Trim();
        if (limpio.Length < 5)
            return (null, "La justificación es demasiado corta.");

        registro.Justificacion = limpio.Length > 500 ? limpio[..500] : limpio;
        registro.JustificadaAt = DateTimeOffset.UtcNow;
        registro.Estado = "Justificada";
        registro.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actorEmail, "Justificar", nameof(RegistroAsistencia), id, ct: ct);

        return (await GetAsync(id, ct), null);
    }

    private static CheckInResult ToResult(RegistroAsistencia r, bool yaRegistrada) => new(
        r.Id, r.Fecha, r.HoraProgramada, r.HoraIngreso, r.MinutosTardanza,
        r.MinutosAnticipacion, r.Tarde, r.Estado, yaRegistrada, r.Estado == "Justificada");
}
