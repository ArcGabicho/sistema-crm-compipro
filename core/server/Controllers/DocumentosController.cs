using Microsoft.AspNetCore.Mvc;
using Server.Config;
using Server.Domain;
using Server.Services;

namespace Server.Controllers;

[Modulo(Modulos.Documentos)]
[Route("api/documentos")]
public sealed class DocumentosController(ICrudService<Documento> service, IDocumentoService documentos)
    : CrudControllerBase<Documento>(service)
{
    protected override IQueryable<Documento> Shape(IQueryable<Documento> q)
    {
        if (Query("search") is { } s) q = q.Where(d => d.Nombre.Contains(s));
        if (Query("carpeta") is { } c) q = q.Where(d => d.Carpeta == c);
        return q;
    }

    /// <summary>Sube un archivo (multipart). Con <c>documentoId</c> reemplaza el archivo como nueva versión.</summary>
    [HttpPost("subir")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<Documento>> Subir(
        IFormFile? archivo, [FromForm] string? carpeta, [FromForm] int? documentoId, CancellationToken ct)
    {
        var (doc, error) = await documentos.SubirAsync(archivo, carpeta, documentoId, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return documentoId is null ? Created((string?)null, doc) : Ok(doc);
    }

    [HttpGet("{id:int}/descargar")]
    public async Task<IActionResult> Descargar(int id, CancellationToken ct)
    {
        var (archivo, error) = await documentos.AbrirAsync(id, ct);
        if (archivo is null) return error is null ? NotFound() : NotFound(new { message = error });
        return File(archivo.Contenido, archivo.ContentType, archivo.Nombre);
    }

    /// <summary>Solo se editan nombre y carpeta: tamaño, versión y archivo los gestiona la subida.</summary>
    public override async Task<ActionResult<Documento>> Update(int id, [FromBody] Documento input, CancellationToken ct)
    {
        var actual = await Service.GetAsync(id, null, ct);
        if (actual is null) return NotFound();

        actual.Nombre = string.IsNullOrWhiteSpace(input.Nombre) ? actual.Nombre : input.Nombre.Trim();
        actual.Carpeta = string.IsNullOrWhiteSpace(input.Carpeta) ? actual.Carpeta : input.Carpeta.Trim();
        return await base.Update(id, actual, ct);
    }

    public override async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await documentos.EliminarAsync(id, Actor, ct) ? NoContent() : NotFound();
}
