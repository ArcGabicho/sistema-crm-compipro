using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface IAuditService
{
    Task LogAsync(string? actor, string accion, string entidad, int? entidadId,
        string? detalle = null, CancellationToken ct = default);

    Task<PagedResult<AuditLog>> ListAsync(int page, int pageSize, string? search,
        CancellationToken ct = default);
}

public sealed class AuditService(AppDbContext db) : IAuditService
{
    public async Task LogAsync(string? actor, string accion, string entidad, int? entidadId,
        string? detalle = null, CancellationToken ct = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserEmail = actor,
            Accion = accion,
            Entidad = entidad,
            EntidadId = entidadId,
            Detalle = detalle,
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AuditLog>> ListAsync(int page, int pageSize, string? search,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<AuditLog> q = db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(a => a.Entidad.Contains(search) ||
                             (a.UserEmail != null && a.UserEmail.Contains(search)));

        int total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(a => a.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PagedResult<AuditLog>(total, page, pageSize, items);
    }
}
