namespace Server.Domain;

/// <summary>Par clave/valor de configuración del sistema.</summary>
public class Configuracion : BaseEntity
{
    public string Clave { get; set; } = string.Empty;
    public string? Valor { get; set; }
    public string? Descripcion { get; set; }
}

/// <summary>Registro de auditoría (quién hizo qué y sobre qué entidad).</summary>
public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? Detalle { get; set; }
}
