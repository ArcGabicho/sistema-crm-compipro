using Server.Config;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[Modulo(Modulos.Email)]
[Route("api/campanas-email")]
public sealed class CampanasEmailController(
    ICrudService<CampanaEmail> service,
    IEmailCampaignService campaigns,
    ProgramadorCampanas programador,
    IEmailSender email) : CrudControllerBase<CampanaEmail>(service)
{
    protected override IQueryable<CampanaEmail> Shape(IQueryable<CampanaEmail> q)
    {
        q = q.Include(c => c.Plantilla);
        if (Query("search") is { } s) q = q.Where(c => c.Nombre.Contains(s));
        if (Query("estado") is { } estado) q = q.Where(c => c.Estado == estado);
        return q;
    }

    // Una campaña nueva o reprogramada puede adelantar el próximo envío.
    protected override void AlCambiar() => programador.Reprogramar();

    /// <summary>Envía la campaña a los clientes activos con email.</summary>
    [HttpPost("{id:int}/enviar")]
    public async Task<IActionResult> Enviar(int id, CancellationToken ct)
    {
        var (resultado, error) = await campaigns.SendAsync(id, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        if (resultado is null) return NotFound();

        programador.Reprogramar();
        return Ok(new
        {
            campana = resultado.Campana,
            reales = resultado.Reales,
            simulados = resultado.Simulados,
            fallidos = resultado.Fallidos,
            // En modo sandbox: la bandeja filtrada por la etiqueta del proyecto.
            bandeja = email.UrlBandejaProyecto,
        });
    }

    /// <summary>Envía la campaña solo a <c>para</c> (no cuenta en las métricas).</summary>
    [HttpPost("{id:int}/prueba")]
    public async Task<IActionResult> Prueba(int id, [FromBody] EnviarPruebaInput input, CancellationToken ct)
    {
        var (resultado, error) = await campaigns.EnviarPruebaAsync(id, input.Para ?? string.Empty, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        if (resultado is null) return NotFound();
        return Ok(new { para = resultado.Para, simulado = resultado.Estado == EstadosEmail.Simulado, url = resultado.Url });
    }
}
