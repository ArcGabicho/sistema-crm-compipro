using Server.Config;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

/// <summary>Bandeja de solicitudes web dentro del CRM (requiere sesión).</summary>
[ApiController]
[Authorize]
[Modulo(Modulos.Solicitudes)]
[Route("api/solicitudes")]
public sealed class SolicitudesController(ISolicitudService solicitudes) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<Solicitud>> List(
        int page = 1, int pageSize = 20, string? tipo = null, string? estado = null,
        string? search = null, CancellationToken ct = default)
        => solicitudes.ListAsync(page, pageSize, tipo, estado, search, ct);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Solicitud>> Get(int id, CancellationToken ct)
        => await solicitudes.GetAsync(id, ct) is { } s ? Ok(s) : NotFound();

    [HttpPost("{id:int}/estado")]
    public async Task<ActionResult<Solicitud>> CambiarEstado(
        int id, [FromBody] SolicitudEstadoInput input, CancellationToken ct)
    {
        var (sol, error) = await solicitudes.CambiarEstadoAsync(id, input, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return sol is null ? NotFound() : Ok(sol);
    }

    /// <summary>Crea (o vincula) un Cliente a partir de la solicitud.</summary>
    [HttpPost("{id:int}/convertir")]
    public async Task<ActionResult<Cliente>> Convertir(int id, CancellationToken ct)
    {
        var (cliente, error) = await solicitudes.ConvertirEnClienteAsync(id, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return cliente is null ? NotFound() : Ok(cliente);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await solicitudes.DeleteAsync(id, Actor, ct) ? NoContent() : NotFound();
}
