using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Route("api/participantes")]
public sealed class ParticipantesController(ICrudService<ParticipanteEvento> service)
    : CrudControllerBase<ParticipanteEvento>(service)
{
    protected override IQueryable<ParticipanteEvento> Shape(IQueryable<ParticipanteEvento> q)
    {
        if (Query("search") is { } s) q = q.Where(p => p.Nombre.Contains(s));
        if (Query("eventoId") is { } e && int.TryParse(e, out int id)) q = q.Where(p => p.EventoId == id);
        if (Query("rol") is { } rol) q = q.Where(p => p.Rol == rol);
        return q;
    }
}
