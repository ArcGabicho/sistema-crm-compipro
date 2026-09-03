namespace Server.Domain;

/// <summary>
/// Registro de ingreso de un trabajador. Se crea una vez por día cuando el
/// usuario entra al sistema; compara la hora real con la hora de entrada
/// programada en su ficha (<see cref="User.HoraEntrada"/>) y marca la tardanza.
/// </summary>
public class RegistroAsistencia : BaseEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }

    public DateOnly Fecha { get; set; }
    public TimeOnly HoraProgramada { get; set; }
    public TimeOnly HoraIngreso { get; set; }

    /// <summary>Minutos de retraso respecto a la hora programada (0 si llegó a tiempo o antes).</summary>
    public int MinutosTardanza { get; set; }

    /// <summary>Minutos de adelanto respecto a la hora programada (0 si llegó a la hora o tarde).</summary>
    public int MinutosAnticipacion { get; set; }

    /// <summary>true cuando el retraso supera la tolerancia.</summary>
    public bool Tarde { get; set; }

    /// <summary>Temprano | ATiempo | Tarde | Justificada</summary>
    public string Estado { get; set; } = "ATiempo";

    public string? Justificacion { get; set; }
    public DateTimeOffset? JustificadaAt { get; set; }
}
