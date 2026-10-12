using Server.Config;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

/// <summary>Control de asistencia y tardanzas del personal.</summary>
[ApiController]
[Authorize]
[Modulo(Modulos.Asistencia)]
[Route("api/asistencia")]
public sealed class AsistenciaController(IAttendanceService asistencia) : ControllerBase
{
    private int CurrentUserId =>
        int.TryParse(User.FindFirstValue("sub"), out int id) ? id : 0;
    private string? CurrentRole => User.FindFirstValue("role");
    private string? CurrentEmail => User.FindFirstValue("email");
    private bool IsAdmin => Roles.Es(CurrentRole, Roles.Admin);
    private bool VeTodos => IsAdmin || Roles.Es(CurrentRole, Roles.Gerencia);

    /// <summary>Registra el ingreso del usuario actual (idempotente por día).</summary>
    [HttpPost("check-in")]
    public async Task<ActionResult<CheckInResult>> CheckIn(CancellationToken ct)
    {
        var result = await asistencia.CheckInAsync(CurrentUserId, ct);
        if (result is null) return NotFound();
        return result.YaRegistrada ? Ok(result) : StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet]
    public Task<PagedResult<RegistroAsistencia>> List(
        int page = 1, int pageSize = 20, int? userId = null,
        string? desde = null, string? hasta = null, bool soloTarde = false,
        CancellationToken ct = default)
    {
        // Admin y gerencia ven a todo el equipo; el resto solo sus propios registros.
        int? scope = VeTodos ? userId : CurrentUserId;
        return asistencia.ListAsync(page, pageSize, scope, ParseDate(desde), ParseDate(hasta), soloTarde, ct);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RegistroAsistencia>> Get(int id, CancellationToken ct)
    {
        var r = await asistencia.GetAsync(id, ct);
        if (r is null) return NotFound();
        if (!VeTodos && r.UserId != CurrentUserId) return Forbid();
        return Ok(r);
    }

    [HttpPost("{id:int}/justificar")]
    public async Task<ActionResult<RegistroAsistencia>> Justificar(
        int id, [FromBody] JustificacionInput input, CancellationToken ct)
    {
        var (registro, error) = await asistencia.JustifyAsync(
            id, input.Texto, CurrentUserId, CurrentRole, CurrentEmail, ct);
        if (error is not null) return BadRequest(new { message = error });
        return registro is null ? NotFound() : Ok(registro);
    }

    private static DateOnly? ParseDate(string? value) =>
        DateOnly.TryParse(value, CultureInfo.InvariantCulture, out var d) ? d : null;
}
