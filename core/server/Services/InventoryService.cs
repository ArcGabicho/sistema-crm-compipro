using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface IInventoryService
{
    Task<PagedResult<MovimientoInventario>> ListAsync(int page, int pageSize, int? productoId, CancellationToken ct);
    Task<(MovimientoInventario? Movimiento, string? Error)> RegisterAsync(MovimientoInput input, string? actor, CancellationToken ct);
}

public sealed class InventoryService(AppDbContext db, IAuditService audit) : IInventoryService
{
    public async Task<PagedResult<MovimientoInventario>> ListAsync(int page, int pageSize, int? productoId, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<MovimientoInventario> q = db.MovimientosInventario.AsNoTracking().Include(m => m.Producto);
        if (productoId is int pid) q = q.Where(m => m.ProductoId == pid);

        int total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(m => m.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PagedResult<MovimientoInventario>(total, page, pageSize, items);
    }

    public async Task<(MovimientoInventario? Movimiento, string? Error)> RegisterAsync(
        MovimientoInput input, string? actor, CancellationToken ct)
    {
        if (input.Cantidad <= 0)
            return (null, "La cantidad debe ser mayor que 0.");

        var producto = await db.Productos.FindAsync([input.ProductoId], ct);
        if (producto is null)
            return (null, "Producto no encontrado.");

        int delta = input.Tipo switch
        {
            "Entrada" => input.Cantidad,
            "Salida" => -input.Cantidad,
            "Ajuste" => input.Cantidad - producto.Stock,
            _ => 0,
        };

        producto.Stock = Math.Max(0, producto.Stock + delta);
        producto.UpdatedAt = DateTimeOffset.UtcNow;

        var movimiento = new MovimientoInventario
        {
            ProductoId = producto.Id,
            Tipo = input.Tipo,
            Cantidad = input.Cantidad,
            Motivo = input.Motivo,
            StockResultante = producto.Stock,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.MovimientosInventario.Add(movimiento);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Movimiento", nameof(Producto), producto.Id,
            $"{input.Tipo} {input.Cantidad}", ct);

        return (movimiento, null);
    }
}
