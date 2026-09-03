using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

public interface IStatsService
{
    Task<OverviewDto> GetOverviewAsync(CancellationToken ct);
    Task<IReadOnlyList<MonthlySalesPoint>> GetMonthlySalesAsync(CancellationToken ct);
    Task<IReadOnlyList<EstadoCount>> GetClientesPorEstadoAsync(CancellationToken ct);
    Task<IReadOnlyList<EstadoCount>> GetTicketsPorEstadoAsync(CancellationToken ct);
    Task<IReadOnlyList<PipelinePunto>> GetPipelineAsync(CancellationToken ct);
    Task<IReadOnlyList<CotizacionMensualPunto>> GetCotizacionesMensualesAsync(CancellationToken ct);
}

public sealed class StatsService(AppDbContext db) : IStatsService
{
    // Orden lógico del embudo comercial de la agencia (nomenclatura real de la cartera).
    private static readonly string[] EtapaOrden =
    [
        "Contacto Inicial-1", "Retomar Contacto", "Pendientes por Cotizar",
        "Cotizado", "Venta Realizado", "Venta No Realizado", "Prod. Entregado",
    ];

    public async Task<OverviewDto> GetOverviewAsync(CancellationToken ct)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var inicioMes = new DateOnly(hoy.Year, hoy.Month, 1);
        var inicioMesAnterior = inicioMes.AddMonths(-1);

        decimal ingresosMes = await db.Ventas
            .Where(v => v.Fecha >= inicioMes).SumAsync(v => (decimal?)v.Monto, ct) ?? 0m;
        decimal ingresosMesAnterior = await db.Ventas
            .Where(v => v.Fecha >= inicioMesAnterior && v.Fecha < inicioMes)
            .SumAsync(v => (decimal?)v.Monto, ct) ?? 0m;

        int cotMes = await db.Cotizaciones.CountAsync(c => c.Fecha >= inicioMes, ct);
        int cotAprobMes = await db.Cotizaciones.CountAsync(c => c.Fecha >= inicioMes && c.Estado == "Aprobada", ct);
        int cerradas = await db.Cotizaciones.CountAsync(c => c.Estado == "Aprobada" || c.Estado == "Rechazada", ct);
        int ganadas = await db.Cotizaciones.CountAsync(c => c.Estado == "Aprobada", ct);

        decimal valorPipeline = await db.Cotizaciones
            .Where(c => c.Estado == "Enviada").SumAsync(c => (decimal?)c.Total, ct) ?? 0m;
        int enProduccion = await db.Pedidos.CountAsync(p => p.EstadoProduccion != "Entregado", ct);
        int atrasados = await db.Pedidos
            .CountAsync(p => p.EstadoProduccion != "Entregado" && p.FechaCompromiso != null && p.FechaCompromiso < hoy, ct);
        decimal porCobrar = await db.Pedidos
            .Where(p => p.Pagado < p.Total).SumAsync(p => (decimal?)(p.Total - p.Pagado), ct) ?? 0m;

        return new OverviewDto(
            Clientes: await db.Clientes.CountAsync(ct),
            ClientesActivos: await db.Clientes.CountAsync(c => c.Estado == "Activo", ct),
            IngresosTotales: await db.Ventas.SumAsync(v => (decimal?)v.Monto, ct) ?? 0m,
            IngresosMes: ingresosMes,
            IngresosMesAnterior: ingresosMesAnterior,
            VariacionMensualPct: ingresosMesAnterior == 0
                ? 0
                : Math.Round((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior * 100, 1),
            TicketsAbiertos: await db.Tickets.CountAsync(t => t.Estado != "Cerrado" && t.Estado != "Resuelto", ct),
            Productos: await db.Productos.CountAsync(ct),
            ProductosBajoStock: await db.Productos.CountAsync(p => p.Stock <= p.StockMinimo, ct),
            EnviosEnCurso: await db.Envios.CountAsync(e => e.Estado == "Preparando" || e.Estado == "EnRuta", ct),
            Documentos: await db.Documentos.CountAsync(ct),
            Proveedores: await db.Proveedores.CountAsync(ct),
            CotizacionesMes: cotMes,
            CotizacionesAprobadasMes: cotAprobMes,
            TasaConversionPct: cerradas == 0 ? 0 : Math.Round((decimal)ganadas / cerradas * 100, 1),
            ValorPipeline: valorPipeline,
            PedidosEnProduccion: enProduccion,
            PedidosAtrasados: atrasados,
            PorCobrar: porCobrar,
            SolicitudesNuevas: await db.Solicitudes.CountAsync(s => s.Estado == "Nueva", ct));
    }

    public async Task<IReadOnlyList<MonthlySalesPoint>> GetMonthlySalesAsync(CancellationToken ct)
    {
        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-11).Date);
        desde = new DateOnly(desde.Year, desde.Month, 1);

        var agrupado = await db.Ventas
            .Where(v => v.Fecha >= desde)
            .GroupBy(v => new { v.Fecha.Year, v.Fecha.Month })
            .Select(gr => new { gr.Key.Year, gr.Key.Month, Total = gr.Sum(x => x.Monto), Cantidad = gr.Count() })
            .ToListAsync(ct);

        return Enumerable.Range(0, 12).Select(i =>
        {
            var mes = desde.AddMonths(i);
            var match = agrupado.FirstOrDefault(a => a.Year == mes.Year && a.Month == mes.Month);
            return new MonthlySalesPoint($"{mes.Year}-{mes.Month:D2}", match?.Total ?? 0m, match?.Cantidad ?? 0);
        }).ToList();
    }

    public async Task<IReadOnlyList<CotizacionMensualPunto>> GetCotizacionesMensualesAsync(CancellationToken ct)
    {
        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-11).Date);
        desde = new DateOnly(desde.Year, desde.Month, 1);

        var rows = await db.Cotizaciones
            .Where(c => c.Fecha >= desde)
            .GroupBy(c => new { c.Fecha.Year, c.Fecha.Month })
            .Select(gr => new
            {
                gr.Key.Year,
                gr.Key.Month,
                Enviadas = gr.Count(),
                Aprobadas = gr.Count(x => x.Estado == "Aprobada"),
                Monto = gr.Where(x => x.Estado == "Aprobada").Sum(x => (decimal?)x.Total) ?? 0m,
            })
            .ToListAsync(ct);

        return Enumerable.Range(0, 12).Select(i =>
        {
            var mes = desde.AddMonths(i);
            var m = rows.FirstOrDefault(a => a.Year == mes.Year && a.Month == mes.Month);
            return new CotizacionMensualPunto($"{mes.Year}-{mes.Month:D2}", m?.Enviadas ?? 0, m?.Aprobadas ?? 0, m?.Monto ?? 0m);
        }).ToList();
    }

    public async Task<IReadOnlyList<EstadoCount>> GetClientesPorEstadoAsync(CancellationToken ct) =>
        await db.Clientes.GroupBy(c => c.Estado)
            .Select(gr => new EstadoCount(gr.Key, gr.Count())).ToListAsync(ct);

    public async Task<IReadOnlyList<EstadoCount>> GetTicketsPorEstadoAsync(CancellationToken ct) =>
        await db.Tickets.GroupBy(t => t.Estado)
            .Select(gr => new EstadoCount(gr.Key, gr.Count())).ToListAsync(ct);

    public async Task<IReadOnlyList<PipelinePunto>> GetPipelineAsync(CancellationToken ct)
    {
        var data = await db.Clientes
            .Where(c => c.Etapa != null && c.Etapa != "")
            .GroupBy(c => c.Etapa!)
            .Select(gr => new { Etapa = gr.Key, Cantidad = gr.Count() })
            .ToListAsync(ct);

        return data
            .Select(d => new PipelinePunto(
                d.Etapa,
                d.Cantidad,
                Array.IndexOf(EtapaOrden, d.Etapa) is var idx && idx >= 0 ? idx : 99))
            .OrderBy(p => p.Orden).ThenByDescending(p => p.Cantidad)
            .ToList();
    }
}
