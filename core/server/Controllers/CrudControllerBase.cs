using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

/// <summary>
/// Controlador REST genérico: GET (listado paginado + filtros), GET/{id}, POST, PUT, DELETE.
/// Los controladores concretos añaden <c>[Route("api/...")]</c> y, opcionalmente,
/// sobrescriben <see cref="Shape"/> para filtros e includes.
/// </summary>
[ApiController]
[Authorize]
public abstract class CrudControllerBase<TEntity>(ICrudService<TEntity> service) : ControllerBase
    where TEntity : BaseEntity
{
    protected ICrudService<TEntity> Service { get; } = service;

    protected string? Actor => User.FindFirstValue("email");

    protected virtual IQueryable<TEntity> Shape(IQueryable<TEntity> query) => query;

    protected string? Query(string key)
    {
        string value = Request.Query[key].ToString();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    [HttpGet]
    public Task<PagedResult<TEntity>> List(int page = 1, int pageSize = 20, CancellationToken ct = default)
        => Service.ListAsync(page, pageSize, Shape, ct);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TEntity>> Get(int id, CancellationToken ct)
        => await Service.GetAsync(id, Shape, ct) is { } entity ? Ok(entity) : NotFound();

    [HttpPost]
    public async Task<ActionResult<TEntity>> Create([FromBody] TEntity input, CancellationToken ct)
    {
        TEntity created = await Service.CreateAsync(input, Actor, ct);
        return Created((string?)null, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TEntity>> Update(int id, [FromBody] TEntity input, CancellationToken ct)
        => await Service.UpdateAsync(id, input, Actor, ct) is { } entity ? Ok(entity) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await Service.DeleteAsync(id, Actor, ct) ? NoContent() : NotFound();
}
