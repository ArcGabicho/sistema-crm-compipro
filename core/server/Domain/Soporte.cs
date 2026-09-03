namespace Server.Domain;

/// <summary>Ticket / solicitud de soporte (módulo Status de Atención).</summary>
public class Ticket : BaseEntity
{
    public string Asunto { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Estado { get; set; } = "Abierto"; // Abierto | EnProceso | Resuelto | Cerrado
    public string Prioridad { get; set; } = "Media"; // Baja | Media | Alta | Urgente
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public int? AsignadoAId { get; set; }
    public User? AsignadoA { get; set; }
}
