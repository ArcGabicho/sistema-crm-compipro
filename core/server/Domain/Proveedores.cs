namespace Server.Domain;

public class Proveedor : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Contacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public int Rating { get; set; } = 3; // 1..5
    public string? TerminosPago { get; set; }
}
