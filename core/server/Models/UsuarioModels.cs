namespace Server.Models;

/// <summary>Payload de alta/edición de usuarios (no expone el hash).</summary>
public sealed record UsuarioInput(
    string? Email,
    string? Name,
    string? Role,
    bool? Activo,
    string? Password,
    /// <summary>Hora de entrada programada, formato "HH:mm".</summary>
    string? HoraEntrada);

/// <summary>Proyección segura de un usuario (sin PasswordHash).</summary>
public sealed record UsuarioDto(
    int Id,
    string Email,
    string Name,
    string Role,
    bool Activo,
    string HoraEntrada,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt);
