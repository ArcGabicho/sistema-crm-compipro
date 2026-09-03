namespace Server.Domain;

/// <summary>Metadatos de un documento del repositorio.</summary>
public class Documento : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Carpeta { get; set; } = "General";
    public string? Tipo { get; set; }
    public long TamanoBytes { get; set; }
    public int Version { get; set; } = 1;
    public string? Url { get; set; }
}
