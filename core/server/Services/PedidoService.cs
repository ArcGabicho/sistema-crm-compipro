using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface IPedidoService
{
    Task<PagedResult<Pedido>> ListAsync(int page, int pageSize, string? estado, bool atrasados, string? search, CancellationToken ct);
    Task<Pedido?> GetAsync(int id, CancellationToken ct);
    Task<(Pedido? Pedido, string? Error)> CambiarEstadoAsync(int id, PedidoEstadoInput input, string? actor, CancellationToken ct);
    Task<(Pedido? Pedido, string? Error)> RegistrarPagoAsync(int id, decimal monto, string? actor, CancellationToken ct);
    Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct);
}

public sealed class PedidoService(AppDbContext db, IAuditService audit) : IPedidoService
{
    private static readonly string[] Estados =
        ["Pendiente", "EnProduccion", "ControlCalidad", "Listo", "Entregado"];

    public async Task<PagedResult<Pedido>> ListAsync(
        int page, int pageSize, string? estado, bool atrasados, string? search, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<Pedido> q = db.Pedidos.AsNoTracking()
            .Include(p => p.Cliente).Include(p => p.Cotizacion);

        if (!string.IsNullOrWhiteSpace(estado)) q = q.Where(p => p.EstadoProduccion == estado);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Codigo.Contains(search) || (p.Cliente != null && p.Cliente.Nombre.Contains(search)));
        if (atrasados)
        {
            var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
            q = q.Where(p => p.EstadoProduccion != "Entregado" && p.FechaCompromiso != null && p.FechaCompromiso < hoy);
        }

        int total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(p => p.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Pedido>(total, page, pageSize, items);
    }

    public Task<Pedido?> GetAsync(int id, CancellationToken ct) =>
        db.Pedidos.AsNoTracking().Include(p => p.Cliente).Include(p => p.Cotizacion)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<(Pedido? Pedido, string? Error)> CambiarEstadoAsync(
        int id, PedidoEstadoInput input, string? actor, CancellationToken ct)
    {
        if (!Estados.Contains(input.EstadoProduccion))
            return (null, $"Estado de producción inválido: {input.EstadoProduccion}.");

        var pedido = await db.Pedidos.FindAsync([id], ct);
        if (pedido is null) return (null, null);

        pedido.EstadoProduccion = input.EstadoProduccion;
        if (input.FechaCompromiso is { } f) pedido.FechaCompromiso = f;
        pedido.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Producción", nameof(Pedido), id, input.EstadoProduccion, ct);
        return (await GetAsync(id, ct), null);
    }

    public async Task<(Pedido? Pedido, string? Error)> RegistrarPagoAsync(
        int id, decimal monto, string? actor, CancellationToken ct)
    {
        if (monto <= 0) return (null, "El monto debe ser mayor que 0.");

        var pedido = await db.Pedidos.FindAsync([id], ct);
        if (pedido is null) return (null, null);

        pedido.Pagado += monto;
        pedido.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Pago", nameof(Pedido), id, $"S/ {monto:0.00}", ct);
        return (await GetAsync(id, ct), null);
    }

    public async Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct)
    {
        var pedido = await db.Pedidos.FindAsync([id], ct);
        if (pedido is null) return false;
        db.Pedidos.Remove(pedido);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Eliminar", nameof(Pedido), id, ct: ct);
        return true;
    }
}
