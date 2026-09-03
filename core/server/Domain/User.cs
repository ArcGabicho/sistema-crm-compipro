using System.Text.Json.Serialization;

namespace Server.Domain;

/// <summary>Cuenta del sistema (tabla <c>Users</c>).</summary>
public class User
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    /// <summary>Rol de la aplicación: <c>admin</c>, <c>user</c>, …</summary>
    public string Role { get; set; } = "user";

    /// <summary>Hash PBKDF2 (formato <c>v1|iteraciones|saltB64|hashB64</c>). Nunca se serializa.</summary>
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    /// <summary>Hora de entrada programada del trabajador (control de asistencia).</summary>
    public TimeOnly HoraEntrada { get; set; } = new(9, 0);

    public DateTimeOffset? LastLoginAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
