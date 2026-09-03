using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

public interface ICotizacionService
{
    Task<PagedResult<Cotizacion>> ListAsync(int page, int pageSize, string? estado, int? clienteId, string? search, CancellationToken ct);
    Task<Cotizacion?> GetAsync(int id, CancellationToken ct);
    Task<Cotizacion> CreateAsync(CotizacionInput input, string? actor, CancellationToken ct);
    Task<Cotizacion?> UpdateAsync(int id, CotizacionInput input, string? actor, CancellationToken ct);
    Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct);
    Task<(Cotizacion? Cotizacion, string? Error)> CambiarEstadoAsync(int id, string estado, string? actor, CancellationToken ct);
    Task<(Pedido? Pedido, string? Error)> AprobarAsync(int id, string? actor, CancellationToken ct);
    Task<Cotizacion?> DuplicarAsync(int id, string? actor, CancellationToken ct);
}

public sealed class CotizacionService(AppDbContext db, IAuditService audit) : ICotizacionService
{
    private const decimal IgvRate = 0.18m;
    private static readonly string[] Estados = ["Borrador", "Enviada", "Aprobada", "Rechazada", "Vencida"];

    public async Task<PagedResult<Cotizacion>> ListAsync(
        int page, int pageSize, string? estado, int? clienteId, string? search, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<Cotizacion> q = db.Cotizaciones.AsNoTracking()
            .Include(c => c.Cliente).Include(c => c.Vendedor).Include(c => c.Items);

        if (!string.IsNullOrWhiteSpace(estado)) q = q.Where(c => c.Estado == estado);
        if (clienteId is int cid) q = q.Where(c => c.ClienteId == cid);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(c => c.Codigo.Contains(search) || (c.Cliente != null && c.Cliente.Nombre.Contains(search)));

        int total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(c => c.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Cotizacion>(total, page, pageSize, items);
    }

    public Task<Cotizacion?> GetAsync(int id, CancellationToken ct) =>
        db.Cotizaciones.AsNoTracking()
            .Include(c => c.Cliente).Include(c => c.Vendedor)
            .Include(c => c.Items).ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Cotizacion> CreateAsync(CotizacionInput input, string? actor, CancellationToken ct)
    {
        var cot = new Cotizacion
        {
            Codigo = await NextCodigoAsync("COT", ct),
            ClienteId = input.ClienteId,
            VendedorId = input.VendedorId,
            Estado = "Borrador",
            Fecha = input.Fecha ?? DateOnly.FromDateTime(DateTime.UtcNow),
            ValidaHasta = input.ValidaHasta ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            Notas = input.Notas,
            Items = BuildItems(input.Items),
        };
        Recalcular(cot);

        db.Cotizaciones.Add(cot);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Crear", nameof(Cotizacion), cot.Id, cot.Codigo, ct);
        return (await GetAsync(cot.Id, ct))!;
    }

    public async Task<Cotizacion?> UpdateAsync(int id, CotizacionInput input, string? actor, CancellationToken ct)
    {
        var cot = await db.Cotizaciones.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cot is null) return null;

        cot.ClienteId = input.ClienteId;
        cot.VendedorId = input.VendedorId;
        cot.Fecha = input.Fecha ?? cot.Fecha;
        cot.ValidaHasta = input.ValidaHasta ?? cot.ValidaHasta;
        cot.Notas = input.Notas;
        cot.UpdatedAt = DateTimeOffset.UtcNow;

        db.CotizacionItems.RemoveRange(cot.Items);
        cot.Items = BuildItems(input.Items);
        Recalcular(cot);

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Actualizar", nameof(Cotizacion), id, cot.Codigo, ct);
        return await GetAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(int id, string? actor, CancellationToken ct)
    {
        var cot = await db.Cotizaciones.FindAsync([id], ct);
        if (cot is null) return false;
        db.Cotizaciones.Remove(cot);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Eliminar", nameof(Cotizacion), id, ct: ct);
        return true;
    }

    public async Task<(Cotizacion? Cotizacion, string? Error)> CambiarEstadoAsync(
        int id, string estado, string? actor, CancellationToken ct)
    {
        if (!Estados.Contains(estado)) return (null, $"Estado inválido: {estado}.");
        var cot = await db.Cotizaciones.FindAsync([id], ct);
        if (cot is null) return (null, null);

        cot.Estado = estado;
        cot.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Estado", nameof(Cotizacion), id, estado, ct);
        return (await GetAsync(id, ct), null);
    }

    public async Task<(Pedido? Pedido, string? Error)> AprobarAsync(int id, string? actor, CancellationToken ct)
    {
        var cot = await db.Cotizaciones.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (cot is null) return (null, null);
        if (cot.Estado == "Aprobada")
            return (null, "La cotización ya fue aprobada.");
        if (cot.Items.Count == 0)
            return (null, "La cotización no tiene líneas.");

        cot.Estado = "Aprobada";
        cot.UpdatedAt = DateTimeOffset.UtcNow;

        int dias = 7;
        var productoIds = cot.Items.Where(i => i.ProductoId != null).Select(i => i.ProductoId!.Value).ToList();
        if (productoIds.Count > 0)
        {
            int? maxDias = await db.Productos
                .Where(p => productoIds.Contains(p.Id))
                .MaxAsync(p => (int?)p.DiasProduccion, ct);
            if (maxDias is { } d) dias = Math.Max(dias, d);
        }

        var pedido = new Pedido
        {
            Codigo = await NextCodigoAsync("PED", ct),
            CotizacionId = cot.Id,
            ClienteId = cot.ClienteId,
            EstadoProduccion = "Pendiente",
            Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
            FechaCompromiso = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(dias)),
            Total = cot.Total,
            Pagado = 0,
        };
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Aprobar", nameof(Cotizacion), id, pedido.Codigo, ct);
        return (pedido, null);
    }

    public async Task<Cotizacion?> DuplicarAsync(int id, string? actor, CancellationToken ct)
    {
        var src = await db.Cotizaciones.AsNoTracking().Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (src is null) return null;

        var copia = new Cotizacion
        {
            Codigo = await NextCodigoAsync("COT", ct),
            ClienteId = src.ClienteId,
            VendedorId = src.VendedorId,
            Estado = "Borrador",
            Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
            ValidaHasta = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            Notas = src.Notas,
            Items = src.Items.Select(i => new CotizacionItem
            {
                ProductoId = i.ProductoId,
                Descripcion = i.Descripcion,
                Tecnica = i.Tecnica,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = i.Subtotal,
            }).ToList(),
        };
        Recalcular(copia);
        db.Cotizaciones.Add(copia);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Duplicar", nameof(Cotizacion), copia.Id, copia.Codigo, ct);
        return await GetAsync(copia.Id, ct);
    }

    // --- helpers ---------------------------------------------------------
    private static List<CotizacionItem> BuildItems(List<CotizacionItemInput>? inputs) =>
        (inputs ?? []).Where(i => i.Cantidad > 0 && !string.IsNullOrWhiteSpace(i.Descripcion))
            .Select(i => new CotizacionItem
            {
                ProductoId = i.ProductoId,
                Descripcion = i.Descripcion.Trim(),
                Tecnica = string.IsNullOrWhiteSpace(i.Tecnica) ? null : i.Tecnica,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                Subtotal = Math.Round(i.Cantidad * i.PrecioUnitario, 2),
            }).ToList();

    private static void Recalcular(Cotizacion cot)
    {
        cot.Subtotal = Math.Round(cot.Items.Sum(i => i.Subtotal), 2);
        cot.Igv = Math.Round(cot.Subtotal * IgvRate, 2);
        cot.Total = cot.Subtotal + cot.Igv;
    }

    private async Task<string> NextCodigoAsync(string prefijo, CancellationToken ct)
    {
        int year = DateTime.UtcNow.Year;
        string tag = $"{prefijo}-{year}-";
        int n = prefijo == "PED"
            ? await db.Pedidos.CountAsync(p => p.Codigo.StartsWith(tag), ct)
            : await db.Cotizaciones.CountAsync(c => c.Codigo.StartsWith(tag), ct);
        return $"{tag}{n + 1:D4}";
    }
}
