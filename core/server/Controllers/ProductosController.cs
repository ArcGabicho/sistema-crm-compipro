using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Route("api/productos")]
public sealed class ProductosController(ICrudService<Producto> service)
    : CrudControllerBase<Producto>(service)
{
    protected override IQueryable<Producto> Shape(IQueryable<Producto> q)
    {
        if (Query("search") is { } s) q = q.Where(p => p.Nombre.Contains(s) || p.Sku.Contains(s));
        if (Query("categoria") is { } cat) q = q.Where(p => p.Categoria == cat);
        if (Query("bajoStock") == "true") q = q.Where(p => p.Stock <= p.StockMinimo);
        return q;
    }
}
