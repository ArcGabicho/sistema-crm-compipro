namespace Server.Config;

/// <summary>
/// Envío de correos (sección <c>Email</c>). Sin <c>Smtp:Host</c> el envío queda
/// en modo simulado: se registra en el log y se cuenta, pero no sale ningún correo.
/// </summary>
public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Remitente { get; set; } = "crm@compipro.net";
    public string NombreRemitente { get; set; } = "Compipro CRM";

    /// <summary>
    /// URL pública del backend (p. ej. https://compipro-api.gabicho.dev). Con ella
    /// los correos reales llevan seguimiento de aperturas y clics.
    /// </summary>
    public string? UrlPublica { get; set; }

    public SmtpOptions Smtp { get; set; } = new();

    public bool SmtpConfigurado => !string.IsNullOrWhiteSpace(Smtp.Host);
}

/// <summary>Servidor SMTP: Gmail, Brevo, Resend, SendGrid, Mailgun… todos lo ofrecen.</summary>
public sealed class SmtpOptions
{
    public string? Host { get; set; }
    public int Puerto { get; set; } = 587;
    public string? Usuario { get; set; }
    public string? Contrasena { get; set; }

    /// <summary>Auto | StartTls | SslOnConnect | None</summary>
    public string Seguridad { get; set; } = "Auto";
}
