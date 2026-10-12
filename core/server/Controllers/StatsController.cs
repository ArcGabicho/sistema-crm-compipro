using Server.Config;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Authorize]
[Modulo(Modulos.Estadisticas)]
[Route("api/stats")]
public sealed class StatsController(IStatsService stats) : ControllerBase
{
    [HttpGet("overview")]
    public Task<OverviewDto> Overview(CancellationToken ct) => stats.GetOverviewAsync(ct);

    [HttpGet("ventas-mensuales")]
    public Task<IReadOnlyList<MonthlySalesPoint>> VentasMensuales(CancellationToken ct)
        => stats.GetMonthlySalesAsync(ct);

    [HttpGet("clientes-por-estado")]
    public Task<IReadOnlyList<EstadoCount>> ClientesPorEstado(CancellationToken ct)
        => stats.GetClientesPorEstadoAsync(ct);

    [HttpGet("tickets-por-estado")]
    public Task<IReadOnlyList<EstadoCount>> TicketsPorEstado(CancellationToken ct)
        => stats.GetTicketsPorEstadoAsync(ct);

    [HttpGet("pipeline")]
    public Task<IReadOnlyList<PipelinePunto>> Pipeline(CancellationToken ct)
        => stats.GetPipelineAsync(ct);

    [HttpGet("cotizaciones-mensuales")]
    public Task<IReadOnlyList<CotizacionMensualPunto>> CotizacionesMensuales(CancellationToken ct)
        => stats.GetCotizacionesMensualesAsync(ct);
}
