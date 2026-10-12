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
[Modulo(Modulos.Cotizaciones)]
[Route("api/cotizaciones")]
public sealed class CotizacionesController(ICotizacionService cotizaciones) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<Cotizacion>> List(
        int page = 1, int pageSize = 20, string? estado = null, int? clienteId = null,
        string? search = null, CancellationToken ct = default)
        => cotizaciones.ListAsync(page, pageSize, estado, clienteId, search, ct);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Cotizacion>> Get(int id, CancellationToken ct)
        => await cotizaciones.GetAsync(id, ct) is { } c ? Ok(c) : NotFound();

    [HttpPost]
    public async Task<ActionResult<Cotizacion>> Create([FromBody] CotizacionInput input, CancellationToken ct)
        => Created((string?)null, await cotizaciones.CreateAsync(input, Actor, ct));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Cotizacion>> Update(int id, [FromBody] CotizacionInput input, CancellationToken ct)
        => await cotizaciones.UpdateAsync(id, input, Actor, ct) is { } c ? Ok(c) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await cotizaciones.DeleteAsync(id, Actor, ct) ? NoContent() : NotFound();

    [HttpPost("{id:int}/estado")]
    public async Task<ActionResult<Cotizacion>> CambiarEstado(int id, [FromBody] CambioEstadoInput input, CancellationToken ct)
    {
        var (cot, error) = await cotizaciones.CambiarEstadoAsync(id, input.Estado, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return cot is null ? NotFound() : Ok(cot);
    }

    /// <summary>Aprueba la cotización y genera un pedido en firme.</summary>
    [HttpPost("{id:int}/aprobar")]
    public async Task<ActionResult<Pedido>> Aprobar(int id, CancellationToken ct)
    {
        var (pedido, error) = await cotizaciones.AprobarAsync(id, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPost("{id:int}/duplicar")]
    public async Task<ActionResult<Cotizacion>> Duplicar(int id, CancellationToken ct)
        => await cotizaciones.DuplicarAsync(id, Actor, ct) is { } c ? Created((string?)null, c) : NotFound();
}
