namespace Server.Models;

public sealed record CotizacionItemInput(
    int? ProductoId,
    string Descripcion,
    string? Tecnica,
    int Cantidad,
    decimal PrecioUnitario);

public sealed record CotizacionInput(
    int ClienteId,
    int? VendedorId,
    DateOnly? Fecha,
    DateOnly? ValidaHasta,
    string? Notas,
    List<CotizacionItemInput>? Items);

public sealed record CambioEstadoInput(string Estado);

public sealed record PedidoEstadoInput(string EstadoProduccion, DateOnly? FechaCompromiso);

public sealed record PagoInput(decimal Monto);

public sealed record PipelinePunto(string Etapa, int Cantidad, int Orden);

public sealed record CotizacionMensualPunto(string Periodo, int Enviadas, int Aprobadas, decimal MontoAprobado);
