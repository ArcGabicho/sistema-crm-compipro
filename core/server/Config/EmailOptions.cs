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

    /// <summary>
    /// El SMTP es un servidor de pruebas (Mailpit, Mailtrap…): nada sale a internet,
    /// así que también se envían los correos a los dominios de demostración (.example).
    /// </summary>
    public bool Sandbox { get; set; }

    /// <summary>Bandeja web del sandbox (p. ej. https://correo.gabicho.dev). Con Mailpit, cada envío enlaza a su mensaje.</summary>
    public string? UrlBandeja { get; set; }

    /// <summary>Etiqueta (cabecera X-Tags) para filtrar los correos de este proyecto en una bandeja compartida.</summary>
    public string? Etiqueta { get; set; } = "compipro";

    /// <summary>
    /// URL de Mailpit para enviar por su API HTTP en vez de SMTP. En Azure Container Apps
    /// el SMTP no despierta una app escalada a cero y HTTP sí. Implica modo sandbox.
    /// </summary>
    public string? MailpitApi { get; set; }

    public SmtpOptions Smtp { get; set; } = new();

    public bool ApiConfigurada => !string.IsNullOrWhiteSpace(MailpitApi);

    public bool SmtpConfigurado => !string.IsNullOrWhiteSpace(Smtp.Host);

    /// <summary>Hay a dónde enviar (Mailpit por HTTP o un SMTP); si no, todo se simula.</summary>
    public bool Configurado => ApiConfigurada || SmtpConfigurado;

    /// <summary>Nada sale a internet: se envía también a los dominios de demostración.</summary>
    public bool EsSandbox => Sandbox || ApiConfigurada;

    /// <summary>simulado | sandbox | smtp</summary>
    public string Modo => !Configurado ? "simulado" : EsSandbox ? "sandbox" : "smtp";
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
