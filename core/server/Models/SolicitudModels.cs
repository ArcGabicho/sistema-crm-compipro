namespace Server.Models;

/// <summary>
/// Payload de los formularios públicos del sitio web (sin autenticación).
/// Lo envía el BFF de Next en <c>POST /api/public/solicitudes</c>.
/// </summary>
public sealed record SolicitudPublicInput(
    string? Tipo,
    string? Nombre,
    string? Empresa,
    string? Email,
    string? Telefono,
    string? Mensaje,
    string? ProductoNombre,
    string? Categoria,
    string? Direccion,
    string? Ciudad,
    string? CodigoPostal);

/// <summary>Cambio de estado de una solicitud desde el CRM.</summary>
public sealed record SolicitudEstadoInput(string Estado, string? Notas);
