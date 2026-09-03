using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Route("api/clientes")]
public sealed class ClientesController(ICrudService<Cliente> service)
    : CrudControllerBase<Cliente>(service)
{
    protected override IQueryable<Cliente> Shape(IQueryable<Cliente> q)
    {
        q = q.Include(c => c.TipoCliente);

        if (Query("search") is { } s)
            q = q.Where(c => c.Nombre.Contains(s) || (c.Email != null && c.Email.Contains(s)));
        if (Query("estado") is { } estado)
            q = q.Where(c => c.Estado == estado);
        if (Query("etapa") is { } etapa)
            q = q.Where(c => c.Etapa == etapa);
        if (Query("tipoClienteId") is { } t && int.TryParse(t, out int tid))
            q = q.Where(c => c.TipoClienteId == tid);

        return q;
    }
}
