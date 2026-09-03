using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Domain;

/// <summary>
/// Cotización de merchandising: cabecera + líneas (producto + técnica de
/// personalización + cantidad + precio). Es el artefacto central de la agencia.
/// </summary>
public class Cotizacion : BaseEntity
{
    public string Codigo { get; set; } = string.Empty;          // COT-2026-0001
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public int? VendedorId { get; set; }
    public User? Vendedor { get; set; }

    public string Estado { get; set; } = "Borrador"; // Borrador | Enviada | Aprobada | Rechazada | Vencida
    public DateOnly Fecha { get; set; }
    public DateOnly? ValidaHasta { get; set; }
    public string? Notas { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Igv { get; set; }
    public decimal Total { get; set; }

    public List<CotizacionItem> Items { get; set; } = [];
}

public class CotizacionItem : BaseEntity
{
    public int CotizacionId { get; set; }
    public Cotizacion? Cotizacion { get; set; }
    public int? ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    /// <summary>Serigrafía | Bordado | Tampografía | Grabado láser | DTF | Full color | Sublimación</summary>
    public string? Tecnica { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

/// <summary>
/// Pedido en firme (cotización aprobada). Seguimiento de producción,
/// fecha compromiso y cobranza (adelanto 50% / saldo contra entrega).
/// </summary>
public class Pedido : BaseEntity
{
    public string Codigo { get; set; } = string.Empty;          // PED-2026-0001
    public int? CotizacionId { get; set; }
    public Cotizacion? Cotizacion { get; set; }
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    /// <summary>Pendiente | EnProduccion | ControlCalidad | Listo | Entregado</summary>
    public string EstadoProduccion { get; set; } = "Pendiente";
    public DateOnly Fecha { get; set; }
    public DateOnly? FechaCompromiso { get; set; }

    public decimal Total { get; set; }
    public decimal Pagado { get; set; }
    public string? Notas { get; set; }

    [NotMapped]
    public string EstadoPago =>
        Pagado >= Total && Total > 0 ? "Pagado" : Pagado > 0 ? "Parcial" : "Pendiente";

    [NotMapped]
    public decimal Saldo => Math.Max(0, Total - Pagado);

    [NotMapped]
    public bool Atrasado =>
        EstadoProduccion != "Entregado"
        && FechaCompromiso is { } f
        && f < DateOnly.FromDateTime(DateTime.UtcNow);
}
