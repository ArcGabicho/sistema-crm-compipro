using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;
using Server.Models;

namespace Server.Services;

/// <summary>Sesión iniciada, o el tiempo que le queda de bloqueo a la cuenta.</summary>
public sealed record ResultadoLogin(LoginResponse? Sesion, TimeSpan? Bloqueada = null);

public interface IAuthService
{
    Task<ResultadoLogin> LoginAsync(LoginRequest request, CancellationToken ct = default);

    /// <summary>Cambia la contraseña del propio usuario. Devuelve un mensaje de error o null.</summary>
    Task<string?> CambiarContrasenaAsync(int userId, CambiarContrasenaRequest request, CancellationToken ct = default);
}

public sealed class AuthService(
    AppDbContext db, ITokenService tokens, IAuditService audit, BloqueoLogin bloqueo) : IAuthService
{
    public const int LongitudMinima = 8;

    public async Task<ResultadoLogin> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return new(null);

        string email = request.Email.Trim();
        // Bloqueada: ni siquiera se comprueba la contraseña (aunque sea la correcta).
        if (bloqueo.Restante(email) is { } resta) return new(null, resta);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !user.Activo || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            // También cuenta para emails inexistentes: no revela qué cuentas existen.
            if (bloqueo.RegistrarFallo(email) is { } duracion)
            {
                await audit.LogAsync(email, "BloqueoLogin", nameof(User), user?.Id, "Demasiados intentos fallidos", ct);
                return new(null, duracion);
            }
            return new(null);
        }

        bloqueo.Limpiar(email);
        user.LastLoginAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        var (token, expiresAt) = tokens.CreateToken(user);
        return new(new LoginResponse(token, user.Email, user.Name, user.Role, expiresAt));
    }

    public async Task<string?> CambiarContrasenaAsync(int userId, CambiarContrasenaRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(request.Actual) || string.IsNullOrEmpty(request.Nueva))
            return "Completa la contraseña actual y la nueva.";
        if (request.Nueva.Length < LongitudMinima)
            return $"La nueva contraseña debe tener al menos {LongitudMinima} caracteres.";
        if (request.Nueva == request.Actual)
            return "La nueva contraseña debe ser distinta de la actual.";

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Activo, ct);
        if (user is null) return "Tu usuario ya no está activo.";
        if (!PasswordHasher.Verify(request.Actual, user.PasswordHash))
            return "La contraseña actual no es correcta.";

        user.PasswordHash = PasswordHasher.Hash(request.Nueva);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(user.Email, "CambiarContrasena", nameof(User), user.Id, ct: ct);
        return null;
    }
}
