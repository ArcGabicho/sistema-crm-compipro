using Server.Config;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Modulo(Modulos.Tickets)]
[Route("api/tickets")]
public sealed class TicketsController(ICrudService<Ticket> service)
    : CrudControllerBase<Ticket>(service)
{
    protected override IQueryable<Ticket> Shape(IQueryable<Ticket> q)
    {
        q = q.Include(t => t.Cliente).Include(t => t.AsignadoA);
        if (Query("search") is { } s) q = q.Where(t => t.Asunto.Contains(s));
        if (Query("estado") is { } estado) q = q.Where(t => t.Estado == estado);
        if (Query("prioridad") is { } prio) q = q.Where(t => t.Prioridad == prio);
        return q;
    }
}
