using Server.Config;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting(RateLimiting.Login)]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "El correo y la contraseña son obligatorios." });

        var resultado = await auth.LoginAsync(request, ct);
        if (resultado.Bloqueada is { } espera)
        {
            int segundos = (int)Math.Ceiling(espera.TotalSeconds);
            Response.Headers.RetryAfter = segundos.ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                message = $"Demasiados intentos fallidos. Espera {RateLimiting.Espera(segundos)} para volver a intentarlo.",
                reintentarEn = segundos,
            });
        }

        return resultado.Sesion is { } sesion
            ? Ok(sesion)
            : StatusCode(StatusCodes.Status401Unauthorized, new { message = "Credenciales inválidas." });
    }

    /// <summary>El usuario cambia su propia contraseña (requiere la actual).</summary>
    [Authorize]
    [Modulo(Modulos.Cuenta)]
    [EnableRateLimiting(RateLimiting.Login)]
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
