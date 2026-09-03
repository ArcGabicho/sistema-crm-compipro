using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

/// <summary>
/// Endpoints públicos (sin autenticación) que alimentan el CRM desde el sitio
/// web: formularios de "Solicitar cotización" y "Contacto".
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/public")]
public sealed class PublicController(ISolicitudService solicitudes) : ControllerBase
{
    [HttpPost("solicitudes")]
    public async Task<IActionResult> CrearSolicitud([FromBody] SolicitudPublicInput input, CancellationToken ct)
    {
        var (solicitud, error) = await solicitudes.CreateFromPublicAsync(input, ct);
        if (error is not null) return BadRequest(new { message = error });
        return Created((string?)null, new { id = solicitud!.Id, ok = true });
    }
}
