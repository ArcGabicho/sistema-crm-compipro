using Server.Config;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Authorize]
[Modulo(Modulos.Inventario)]
[Route("api/movimientos-inventario")]
public sealed class MovimientosInventarioController(IInventoryService inventory) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<MovimientoInventario>> List(
        int page = 1, int pageSize = 20, int? productoId = null, CancellationToken ct = default)
        => inventory.ListAsync(page, pageSize, productoId, ct);

    [HttpPost]
    public async Task<ActionResult<MovimientoInventario>> Create(
        [FromBody] MovimientoInput input, CancellationToken ct)
    {
        var (movimiento, error) = await inventory.RegisterAsync(input, Actor, ct);
        return error is not null ? BadRequest(new { message = error }) : Created((string?)null, movimiento);
    }
}
