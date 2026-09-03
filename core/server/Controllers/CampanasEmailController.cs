using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Route("api/campanas-email")]
public sealed class CampanasEmailController(
    ICrudService<CampanaEmail> service,
    IEmailCampaignService campaigns) : CrudControllerBase<CampanaEmail>(service)
{
    protected override IQueryable<CampanaEmail> Shape(IQueryable<CampanaEmail> q)
    {
        q = q.Include(c => c.Plantilla);
        if (Query("search") is { } s) q = q.Where(c => c.Nombre.Contains(s));
        if (Query("estado") is { } estado) q = q.Where(c => c.Estado == estado);
        return q;
    }

    /// <summary>Envía la campaña (simulado): calcula destinatarios y métricas.</summary>
    [HttpPost("{id:int}/enviar")]
    public async Task<ActionResult<CampanaEmail>> Enviar(int id, CancellationToken ct)
        => await campaigns.SendAsync(id, Actor, ct) is { } campana ? Ok(campana) : NotFound();
}
