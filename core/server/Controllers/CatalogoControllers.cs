using Server.Config;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Modulo(Modulos.TiposCliente)]
[Route("api/tipos-cliente")]
public sealed class TiposClienteController(ICrudService<TipoCliente> service)
    : CrudControllerBase<TipoCliente>(service)
{
    protected override IQueryable<TipoCliente> Shape(IQueryable<TipoCliente> q)
        => Query("search") is { } s ? q.Where(t => t.Nombre.Contains(s)) : q;
}

[Modulo(Modulos.Ventas)]
[Route("api/ventas")]
public sealed class VentasController(ICrudService<Venta> service)
    : CrudControllerBase<Venta>(service)
{
    protected override IQueryable<Venta> Shape(IQueryable<Venta> q)
    {
        q = q.Include(v => v.Cliente);
        if (Query("clienteId") is { } c && int.TryParse(c, out int id))
            q = q.Where(v => v.ClienteId == id);
        return q;
    }
}

[Modulo(Modulos.Proveedores)]
[Route("api/proveedores")]
public sealed class ProveedoresController(ICrudService<Proveedor> service)
    : CrudControllerBase<Proveedor>(service)
{
    protected override IQueryable<Proveedor> Shape(IQueryable<Proveedor> q)
    {
        if (Query("search") is { } s)
            q = q.Where(p => p.Nombre.Contains(s) || (p.Contacto != null && p.Contacto.Contains(s)));
        if (Query("rating") is { } r && int.TryParse(r, out int rating))
            q = q.Where(p => p.Rating == rating);
        return q;
    }
}

[Modulo(Modulos.Configuracion)]
[Route("api/configuracion")]
public sealed class ConfiguracionController(ICrudService<Configuracion> service)
    : CrudControllerBase<Configuracion>(service)
{
    protected override IQueryable<Configuracion> Shape(IQueryable<Configuracion> q)
        => Query("search") is { } s ? q.Where(c => c.Clave.Contains(s)) : q;
}

[Modulo(Modulos.Eventos)]
[Route("api/eventos")]
public sealed class EventosController(ICrudService<Evento> service)
    : CrudControllerBase<Evento>(service)
{
    protected override IQueryable<Evento> Shape(IQueryable<Evento> q)
        => Query("search") is { } s ? q.Where(e => e.Nombre.Contains(s) || (e.Ubicacion != null && e.Ubicacion.Contains(s))) : q;
}

[Modulo(Modulos.Email)]
[Route("api/plantillas-email")]
public sealed class PlantillasEmailController(ICrudService<PlantillaEmail> service)
    : CrudControllerBase<PlantillaEmail>(service)
{
    protected override IQueryable<PlantillaEmail> Shape(IQueryable<PlantillaEmail> q)
        => Query("search") is { } s ? q.Where(p => p.Nombre.Contains(s)) : q;
}
