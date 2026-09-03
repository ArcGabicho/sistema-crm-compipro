namespace Server.Domain;

public class PlantillaEmail : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string CuerpoHtml { get; set; } = string.Empty;
}

public class CampanaEmail : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public int? PlantillaId { get; set; }
    public PlantillaEmail? Plantilla { get; set; }
    public string Estado { get; set; } = "Borrador"; // Borrador | Programada | Enviada
    public DateTimeOffset? ProgramadaPara { get; set; }
    public int Destinatarios { get; set; }
    public int Enviados { get; set; }
    public int Aperturas { get; set; }
    public int Clicks { get; set; }
}
