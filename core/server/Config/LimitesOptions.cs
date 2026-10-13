namespace Server.Config;

/// <summary>
/// Límites contra abuso (sección <c>Limites</c>): bloqueo por cuenta tras varios
/// logins fallidos y límites por IP del visitante.
/// </summary>
public sealed class LimitesOptions
{
    public const string SectionName = "Limites";

    /// <summary>Logins fallidos seguidos que bloquean la cuenta.</summary>
    public int LoginMaxFallos { get; set; } = 5;

    /// <summary>Tiempo en que se cuentan los fallos (se reinicia al pasar).</summary>
    public TimeSpan LoginVentana { get; set; } = TimeSpan.FromMinutes(15);

    /// <summary>Duración del bloqueo de la cuenta.</summary>
    public TimeSpan LoginBloqueo { get; set; } = TimeSpan.FromMinutes(5);

    /// <summary>Intentos de login por minuto desde una misma IP (a cualquier cuenta).</summary>
    public int LoginPorMinuto { get; set; } = 10;

    /// <summary>Envíos por minuto de los formularios públicos del sitio por IP.</summary>
    public int PublicoPorMinuto { get; set; } = 5;

    /// <summary>Peticiones por minuto a toda la API por IP.</summary>
    public int GeneralPorMinuto { get; set; } = 300;

    /// <summary>
    /// Secreto compartido con el BFF de Next.js. Solo si coincide se confía en la
    /// cabecera <c>X-Cliente-IP</c>: el BFF llama desde los servidores de Vercel y,
    /// sin ella, todos los visitantes compartirían la IP de Vercel.
    /// </summary>
    public string? ClaveBff { get; set; }
}
