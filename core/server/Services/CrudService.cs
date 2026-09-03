using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

/// <summary>Operaciones CRUD genéricas con auditoría para cualquier <see cref="BaseEntity"/>.</summary>
public interface ICrudService<TEntity> where TEntity : BaseEntity
{
    Task<PagedResult<TEntity>> ListAsync(int page, int pageSize,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? shape, CancellationToken ct);

    Task<TEntity?> GetAsync(int id,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? shape, CancellationToken ct);

    Task<TEntity> CreateAsync(TEntity input, string? actor, CancellationToken ct);

    Task<TEntity?> UpdateAsync(int id, TEntity input, string? actor, CancellationToken ct);

    Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct);
}

public sealed class CrudService<TEntity>(AppDbContext db, IAuditService audit)
    : ICrudService<TEntity> where TEntity : BaseEntity
{
    private static readonly string EntityName = typeof(TEntity).Name;

    public async Task<PagedResult<TEntity>> ListAsync(int page, int pageSize,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? shape, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<TEntity> q = db.Set<TEntity>().AsNoTracking();
        if (shape is not null) q = shape(q);

        int total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(e => e.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<TEntity>(total, page, pageSize, items);
    }

    public Task<TEntity?> GetAsync(int id,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? shape, CancellationToken ct)
    {
        IQueryable<TEntity> q = db.Set<TEntity>().AsNoTracking();
        if (shape is not null) q = shape(q);
        return q.FirstOrDefaultAsync(e => e.Id == id, ct);
    }

    public async Task<TEntity> CreateAsync(TEntity input, string? actor, CancellationToken ct)
    {
        input.Id = 0;
        input.CreatedAt = DateTimeOffset.UtcNow;
        input.UpdatedAt = null;

        db.Set<TEntity>().Add(input);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Crear", EntityName, input.Id, ct: ct);
        return input;
    }

    public async Task<TEntity?> UpdateAsync(int id, TEntity input, string? actor, CancellationToken ct)
    {
        var entity = await db.Set<TEntity>().FindAsync([id], ct);
        if (entity is null) return null;

        // El body puede no traer Id/CreatedAt; los fijamos para que SetValues no
        // intente cambiar la clave ni pisar la fecha de alta.
        input.Id = id;
        input.CreatedAt = entity.CreatedAt;
        input.UpdatedAt = DateTimeOffset.UtcNow;
        db.Entry(entity).CurrentValues.SetValues(input);

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Actualizar", EntityName, id, ct: ct);
        return entity;
    }

    public async Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct)
    {
        var entity = await db.Set<TEntity>().FindAsync([id], ct);
        if (entity is null) return false;

        db.Set<TEntity>().Remove(entity);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Eliminar", EntityName, id, ct: ct);
        return true;
    }
}
