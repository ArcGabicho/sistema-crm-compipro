using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

/// <summary>
/// Controlador REST genérico: GET (listado paginado + filtros), GET/{id}, POST, PUT, DELETE
/// y GET exportar (Excel/CSV). Los controladores concretos añaden <c>[Route("api/...")]</c>
/// y, opcionalmente, sobrescriben <see cref="Shape"/> para filtros e includes.
/// </summary>
[ApiController]
[Authorize]
public abstract class CrudControllerBase<TEntity>(ICrudService<TEntity> service) : ControllerBase
    where TEntity : BaseEntity
{
    protected ICrudService<TEntity> Service { get; } = service;

    protected string? Actor => User.FindFirstValue("email");

    protected virtual IQueryable<TEntity> Shape(IQueryable<TEntity> query) => query;

    /// <summary>Se llama tras crear, actualizar o eliminar un registro.</summary>
    protected virtual void AlCambiar() { }

    protected string? Query(string key)
    {
        string value = Request.Query[key].ToString();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    [HttpGet]
    public Task<PagedResult<TEntity>> List(int page = 1, int pageSize = 20, CancellationToken ct = default)
        => Service.ListAsync(page, pageSize, Shape, ct);

    /// <summary>Exporta a Excel (formato=xlsx) o CSV todo lo que coincide con los filtros actuales.</summary>
    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(
        [FromServices] IExportService export, string? formato = "xlsx", CancellationToken ct = default)
    {
        var filas = await Service.ListAllAsync(Shape, ExportService.MaxFilas, ct);
        var archivo = export.Exportar(filas, formato, NombreArchivo());
        return File(archivo.Contenido, archivo.ContentType, archivo.Nombre);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TEntity>> Get(int id, CancellationToken ct)
        => await Service.GetAsync(id, Shape, ct) is { } entity ? Ok(entity) : NotFound();

    [HttpPost]
    public virtual async Task<ActionResult<TEntity>> Create([FromBody] TEntity input, CancellationToken ct)
    {
        TEntity created = await Service.CreateAsync(input, Actor, ct);
        AlCambiar();
        return Created((string?)null, created);
    }

    [HttpPut("{id:int}")]
    public virtual async Task<ActionResult<TEntity>> Update(int id, [FromBody] TEntity input, CancellationToken ct)
    {
        if (await Service.UpdateAsync(id, input, Actor, ct) is not { } entity) return NotFound();
        AlCambiar();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public virtual async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        if (!await Service.DeleteAsync(id, Actor, ct)) return NotFound();
        AlCambiar();
        return NoContent();
    }

    /// <summary>"TiposCliente" → "tipos-cliente".</summary>
    private string NombreArchivo()
        => Regex.Replace(ControllerContext.ActionDescriptor.ControllerName, "([a-z0-9])([A-Z])", "$1-$2").ToLowerInvariant();
}
