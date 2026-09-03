namespace Server.Domain;

/// <summary>
/// Solicitud entrante desde el sitio público: formularios de "Solicitar
/// cotización" (página de contacto y fichas de producto) y de "Contacto".
/// Funciona como una bandeja de entrada comercial: el equipo la revisa, la
/// atiende y la convierte en Cliente / Cotización dentro del CRM.
/// </summary>
public class Solicitud : BaseEntity
{
    /// <summary>Cotizacion | Contacto</summary>
    public string Tipo { get; set; } = "Cotizacion";

    public string Nombre { get; set; } = string.Empty;
    public string? Empresa { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Mensaje { get; set; }

    // Contexto de la página de origen (cuando llega desde una ficha de producto).
    public string? ProductoNombre { get; set; }
    public string? Categoria { get; set; }

    // Dirección (formulario de contacto de la web).
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? CodigoPostal { get; set; }

    // --- Gestión dentro del CRM ---
    /// <summary>Nueva | Atendida | Convertida | Descartada</summary>
    public string Estado { get; set; } = "Nueva";
    public string Origen { get; set; } = "Web";
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public string? Notas { get; set; }
    public DateTimeOffset? AtendidaAt { get; set; }
}
