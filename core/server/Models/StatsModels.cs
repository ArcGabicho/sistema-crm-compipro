namespace Server.Models;

public sealed record OverviewDto(
    int Clientes,
    int ClientesActivos,
    decimal IngresosTotales,
    decimal IngresosMes,
    decimal IngresosMesAnterior,
    decimal VariacionMensualPct,
    int TicketsAbiertos,
    int Productos,
    int ProductosBajoStock,
    int EnviosEnCurso,
    int Documentos,
    int Proveedores,
    // --- KPIs de agencia de merchandising ---
    int CotizacionesMes,
    int CotizacionesAprobadasMes,
    decimal TasaConversionPct,
    decimal ValorPipeline,
    int PedidosEnProduccion,
    int PedidosAtrasados,
    decimal PorCobrar,
    int SolicitudesNuevas);

public sealed record MonthlySalesPoint(string Periodo, decimal Total, int Cantidad);

public sealed record EstadoCount(string Estado, int Cantidad);
