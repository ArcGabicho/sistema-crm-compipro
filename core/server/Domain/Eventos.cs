namespace Server.Domain;

public class Evento : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Ubicacion { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
}

public class ParticipanteEvento : BaseEntity
{
    public int EventoId { get; set; }
    public Evento? Evento { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Rol { get; set; } // Cliente | Proveedor | Staff
    public string? Stand { get; set; }
    public bool Asistio { get; set; }
}
