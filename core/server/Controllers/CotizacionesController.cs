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
public sealed class CotizacionesController(
    ICotizacionService cotizaciones,
    ICotizacionDocumentoService documentos) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<Cotizacion>> List(
        int page = 1, int pageSize = 20, string? estado = null, int? clienteId = null,
        string? search = null, CancellationToken ct = default)
        => cotizaciones.ListAsync(page, pageSize, estado, clienteId, search, ct);

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(
        [FromServices] IExportService export, string? formato = "xlsx", string? estado = null,
        int? clienteId = null, string? search = null, CancellationToken ct = default)
    {
        var filas = await ExportService.TodasLasPaginas(p => cotizaciones.ListAsync(p, 200, estado, clienteId, search, ct));
        var archivo = export.Exportar(filas, formato, "cotizaciones");
        return File(archivo.Contenido, archivo.ContentType, archivo.Nombre);
    }

    /// <summary>PDF de la cotización; <c>descargar=true</c> lo baja como adjunto en vez de abrirlo.</summary>
    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id, bool descargar = false, CancellationToken ct = default)
    {
        var pdf = await documentos.GenerarPdfAsync(id, ct);
        if (pdf is null) return NotFound();
        if (descargar) return File(pdf.Contenido, "application/pdf", pdf.Nombre);

        Response.Headers.ContentDisposition = $"inline; filename=\"{pdf.Nombre}\"";
        return File(pdf.Contenido, "application/pdf");
    }

    /// <summary>Envía el PDF por email y, si estaba en borrador, la marca como Enviada.</summary>
    [HttpPost("{id:int}/enviar-email")]
    public async Task<IActionResult> EnviarEmail(int id, [FromBody] EnviarCotizacionInput input, CancellationToken ct)
    {
        var (resultado, error) = await documentos.EnviarPorEmailAsync(id, input.Para, input.Mensaje, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return resultado is null ? NotFound() : Ok(resultado);
    }

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
