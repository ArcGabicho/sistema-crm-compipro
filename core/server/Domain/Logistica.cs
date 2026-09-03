namespace Server.Domain;

/// <summary>Envío / entrega (módulo Logística).</summary>
public class Envio : BaseEntity
{
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public string Direccion { get; set; } = string.Empty;
    public string Estado { get; set; } = "Preparando"; // Preparando | EnRuta | Entregado | Devuelto
    public string? Transportista { get; set; }
    public string? Tracking { get; set; }
    public string? Ruta { get; set; }
    public DateOnly? FechaEstimada { get; set; }
}
