using Server.Config;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "El correo y la contraseña son obligatorios." });

        LoginResponse? result = await auth.LoginAsync(request, ct);
        return result is null
            ? StatusCode(StatusCodes.Status401Unauthorized, new { message = "Credenciales inválidas." })
            : Ok(result);
    }

    /// <summary>El usuario cambia su propia contraseña (requiere la actual).</summary>
    [Authorize]
    [Modulo(Modulos.Cuenta)]
    [HttpPost("cambiar-contrasena")]
    public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContrasenaRequest request, CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirstValue("sub"), out int userId)) return Unauthorized();

        string? error = await auth.CambiarContrasenaAsync(userId, request, ct);
        return error is null ? NoContent() : BadRequest(new { message = error });
    }

    [Authorize]
    [Modulo(Modulos.Cuenta)]
    [HttpGet("me")]
    public ActionResult<CurrentUserResponse> Me()
        => Ok(new CurrentUserResponse(
            User.FindFirstValue("email") ?? User.Identity?.Name,
            User.FindFirstValue("name"),
            User.FindFirstValue("role")));
}
