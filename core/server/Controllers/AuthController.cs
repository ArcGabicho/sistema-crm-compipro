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

    [Authorize]
    [HttpGet("me")]
    public ActionResult<CurrentUserResponse> Me()
        => Ok(new CurrentUserResponse(
            User.FindFirstValue("email") ?? User.Identity?.Name,
            User.FindFirstValue("name"),
            User.FindFirstValue("role")));
}
