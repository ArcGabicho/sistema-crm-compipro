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
[Modulo(Modulos.Pedidos)]
[Route("api/pedidos")]
public sealed class PedidosController(IPedidoService pedidos) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<Pedido>> List(
        int page = 1, int pageSize = 20, string? estado = null, bool atrasados = false,
        string? search = null, CancellationToken ct = default)
        => pedidos.ListAsync(page, pageSize, estado, atrasados, search, ct);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Pedido>> Get(int id, CancellationToken ct)
        => await pedidos.GetAsync(id, ct) is { } p ? Ok(p) : NotFound();

    [HttpPost("{id:int}/estado")]
    public async Task<ActionResult<Pedido>> CambiarEstado(int id, [FromBody] PedidoEstadoInput input, CancellationToken ct)
    {
        var (pedido, error) = await pedidos.CambiarEstadoAsync(id, input, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPost("{id:int}/pago")]
    public async Task<ActionResult<Pedido>> RegistrarPago(int id, [FromBody] PagoInput input, CancellationToken ct)
    {
        var (pedido, error) = await pedidos.RegistrarPagoAsync(id, input.Monto, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await pedidos.DeleteAsync(id, Actor, ct) ? NoContent() : NotFound();
}
