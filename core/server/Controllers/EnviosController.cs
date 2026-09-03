using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Route("api/envios")]
public sealed class EnviosController(ICrudService<Envio> service)
    : CrudControllerBase<Envio>(service)
{
    protected override IQueryable<Envio> Shape(IQueryable<Envio> q)
    {
        q = q.Include(e => e.Cliente);
        if (Query("search") is { } s)
            q = q.Where(e => (e.Tracking != null && e.Tracking.Contains(s)) || e.Direccion.Contains(s));
        if (Query("estado") is { } estado)
            q = q.Where(e => e.Estado == estado);
        return q;
    }
}
