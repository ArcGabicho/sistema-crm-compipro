using Server.Config;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Authorize]
[Modulo(Modulos.Usuarios)]
[Route("api/usuarios")]
public sealed class UsuariosController(IUserService users) : ControllerBase
{
    private string? Actor => User.FindFirstValue("email");

    [HttpGet]
    public Task<PagedResult<UsuarioDto>> List(
        int page = 1, int pageSize = 20, string? search = null, string? role = null,
        CancellationToken ct = default)
        => users.ListAsync(page, pageSize, search, role, ct);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Get(int id, CancellationToken ct)
        => await users.GetAsync(id, ct) is { } dto ? Ok(dto) : NotFound();

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create([FromBody] UsuarioInput input, CancellationToken ct)
    {
        var (user, error) = await users.CreateAsync(input, Actor, ct);
        return error is not null ? BadRequest(new { message = error }) : Created((string?)null, user);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Update(int id, [FromBody] UsuarioInput input, CancellationToken ct)
    {
        var (user, error) = await users.UpdateAsync(id, input, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return user is null ? NotFound() : Ok(user);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var (found, error) = await users.DeactivateAsync(id, Actor, ct);
        if (error is not null) return BadRequest(new { message = error });
        return found ? NoContent() : NotFound();
    }
}
