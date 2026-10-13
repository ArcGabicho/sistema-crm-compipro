using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Config;
using Server.Services;

namespace Server.Controllers;

/// <summary>Estado del servicio de correo, para que el panel indique si el envío es real o simulado.</summary>
[ApiController]
[Authorize]
[Modulo(Modulos.Cuenta)]
[Route("api/email")]
public sealed class EmailController(IEmailSender email, SeguimientoEmail seguimiento) : ControllerBase
{
    [HttpGet("estado")]
    public IActionResult Estado()
        => Ok(new { real = email.EsReal, remitente = email.Remitente, seguimiento = seguimiento.Activo });
}

/// <summary>
/// Píxel de apertura y redirección de clics de las campañas (públicos: los
/// abre el cliente de correo del destinatario). Las URLs van firmadas.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/public/email")]
public sealed class SeguimientoEmailController(
    IEmailCampaignService campanas,
    SeguimientoEmail seguimiento,
    ILogger<SeguimientoEmailController> logger) : ControllerBase
{
    // GIF transparente de 1×1.
    private static readonly byte[] Pixel = Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");

    [HttpGet("abierto")]
    public async Task<IActionResult> Abierto(int c, string? s, CancellationToken ct)
    {
        if (seguimiento.ValidarApertura(c, s)) await Registrar(() => campanas.RegistrarAperturaAsync(c, ct));
        Response.Headers.CacheControl = "no-store, max-age=0";
        return File(Pixel, "image/gif");
    }

    [HttpGet("clic")]
    public async Task<IActionResult> Clic(int c, string? u, string? s, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(u) || !seguimiento.ValidarClic(c, u, s)) return BadRequest();
        await Registrar(() => campanas.RegistrarClicAsync(c, ct));
        return Redirect(u);
    }

    // Una métrica que no se pudo guardar no debe romper el correo del destinatario.
    private async Task Registrar(Func<Task> accion)
    {
        try { await accion(); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "No se pudo registrar la métrica de email.");
        }
    }
}
