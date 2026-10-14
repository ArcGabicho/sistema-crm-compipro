using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Server.Config;

namespace Server.Services;

public sealed record AdjuntoEmail(string Nombre, byte[] Contenido, string ContentType);

public sealed record MensajeEmail(string Para, string Asunto, string Html, string? NombrePara = null)
{
    public IReadOnlyList<AdjuntoEmail> Adjuntos { get; init; } = [];
}

/// <summary>
/// Resultado por destinatario: Enviado (salió por SMTP), Simulado o Fallido.
/// <c>Url</c> enlaza al mensaje en la bandeja del sandbox, si la hay.
/// </summary>
public sealed record ResultadoEmail(string Para, string Estado, string? Error = null, string? Url = null)
{
    public bool Ok => Estado != EstadosEmail.Fallido;
}

public static class EstadosEmail
{
    public const string Enviado = "Enviado";
    public const string Simulado = "Simulado";
    public const string Fallido = "Fallido";
}

public interface IEmailSender
{
    /// <summary>true si hay a dónde enviar (SMTP o Mailpit por HTTP); false = todo se simula.</summary>
    bool EsReal { get; }

    /// <summary>simulado | sandbox | smtp</summary>
    string Modo { get; }

    /// <summary>Bandeja web del sandbox, si está configurada.</summary>
    string? UrlBandeja { get; }

    /// <summary>La bandeja filtrada por la etiqueta de este proyecto (X-Tags).</summary>
    string? UrlBandejaProyecto { get; }

    string Remitente { get; }

    /// <summary>¿Este destinatario recibiría un correo de verdad?</summary>
    bool EnviaDeVerdad(string email);

    /// <summary>Envía en lote reutilizando una sola conexión SMTP.</summary>
    Task<IReadOnlyList<ResultadoEmail>> EnviarAsync(IReadOnlyList<MensajeEmail> mensajes, CancellationToken ct);

    /// <summary>
    /// Despierta la bandeja de pruebas antes de enviar (Mailpit escala a cero en Azure).
    /// true cuando responde, o si no hay bandeja que despertar.
    /// </summary>
    Task<bool> DespertarAsync(CancellationToken ct);
}

public static class EmailSenderExtensions
{
    public static async Task<ResultadoEmail> EnviarAsync(
        this IEmailSender sender, MensajeEmail mensaje, CancellationToken ct)
        => (await sender.EnviarAsync([mensaje], ct))[0];
}

/// <summary>
/// Envío por SMTP con MailKit, o por la API HTTP de Mailpit. Sin servidor configurado,
/// o si el destinatario es de un dominio reservado (los clientes de demostración usan
/// <c>.example</c>), el mensaje se simula: se registra en el log y se cuenta como entregado.
/// En modo sandbox (Mailpit) se envía todo: nada sale a internet.
/// </summary>
public sealed partial class EmailSender(
    IOptions<EmailOptions> options, IHttpClientFactory httpClients, ILogger<EmailSender> logger)
    : IEmailSender
{
    private readonly EmailOptions opt = options.Value;

    // RFC 2606 / 6761: estos dominios nunca reciben correo.
    private static readonly string[] SufijosReservados = [".example", ".test", ".invalid", ".localhost"];
    private static readonly string[] DominiosReservados = ["example.com", "example.net", "example.org"];

    // La API de Mailpit usa los nombres tal cual (From, To, HTML…), sin camelCase.
    private static readonly JsonSerializerOptions JsonMailpit = new();

    public bool EsReal => opt.Configurado;

    public string Remitente => opt.Remitente;

    public string Modo => opt.Modo;

    public string? UrlBandeja => string.IsNullOrWhiteSpace(opt.UrlBandeja) ? null : opt.UrlBandeja.Trim().TrimEnd('/');

    public string? UrlBandejaProyecto => UrlBandeja is not { } bandeja ? null
        : string.IsNullOrWhiteSpace(opt.Etiqueta) ? bandeja
        : $"{bandeja}/search?q={Uri.EscapeDataString("tag:" + opt.Etiqueta)}";

    public bool EnviaDeVerdad(string email) => EsReal && (opt.EsSandbox || !EsDominioReservado(email));

    public static bool EsEmailValido(string? email)
        => !string.IsNullOrWhiteSpace(email)
           && MailboxAddress.TryParse(email.Trim(), out var buzon)
           && buzon.Address.Contains('@');

    private static bool EsDominioReservado(string email)
    {
        string dominio = email[(email.LastIndexOf('@') + 1)..].Trim().ToLowerInvariant();
        return DominiosReservados.Contains(dominio) || SufijosReservados.Any(dominio.EndsWith);
    }

    public async Task<IReadOnlyList<ResultadoEmail>> EnviarAsync(
        IReadOnlyList<MensajeEmail> mensajes, CancellationToken ct)
    {
        var resultados = new ResultadoEmail[mensajes.Count];
        var reales = new List<int>();

        for (int i = 0; i < mensajes.Count; i++)
        {
            string para = mensajes[i].Para.Trim();
            if (!EsEmailValido(para))
                resultados[i] = new(para, EstadosEmail.Fallido, "Dirección de correo inválida.");
            else if (EnviaDeVerdad(para))
                reales.Add(i);
            else
                resultados[i] = new(para, EstadosEmail.Simulado);
        }

        int simulados = resultados.Count(r => r?.Estado == EstadosEmail.Simulado);
        if (simulados > 0)
        {
            logger.LogInformation("Email simulado: {Cantidad} mensaje(s) «{Asunto}»",
                simulados, mensajes[0].Asunto);
        }

        if (reales.Count > 0)
        {
            if (opt.ApiConfigurada) await EnviarPorApiAsync(mensajes, reales, resultados, ct);
            else await EnviarPorSmtpAsync(mensajes, reales, resultados, ct);
        }
        return resultados;
    }

    public async Task<bool> DespertarAsync(CancellationToken ct)
    {
        if (!opt.ApiConfigurada) return true;
        try
        {
            HttpClient http = httpClients.CreateClient(nameof(EmailSender));
            using var respuesta = await http.GetAsync($"{opt.MailpitApi!.Trim().TrimEnd('/')}/api/v1/info", ct);
            return respuesta.IsSuccessStatusCode;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Mailpit no respondió al despertarlo.");
            return false;
        }
    }

    /// <summary>Mailpit por HTTP (POST /api/v1/send): responde el ID del mensaje en su bandeja.</summary>
    private async Task EnviarPorApiAsync(
        IReadOnlyList<MensajeEmail> mensajes, List<int> indices, ResultadoEmail[] resultados, CancellationToken ct)
    {
        HttpClient http = httpClients.CreateClient(nameof(EmailSender));
        string url = $"{opt.MailpitApi!.Trim().TrimEnd('/')}/api/v1/send";

        await Parallel.ForEachAsync(indices, new ParallelOptions { MaxDegreeOfParallelism = 4, CancellationToken = ct },
            async (i, token) =>
            {
                MensajeEmail m = mensajes[i];
                try
                {
                    using var respuesta = await http.PostAsJsonAsync(url, CuerpoApi(m), JsonMailpit, token);
                    respuesta.EnsureSuccessStatusCode();
                    var enviado = await respuesta.Content.ReadFromJsonAsync<RespuestaMailpit>(JsonMailpit, token);
                    string? enlace = enviado?.ID is { Length: > 0 } id && UrlBandeja is { } bandeja
                        ? $"{bandeja}/view/{id}"
                        : null;
                    resultados[i] = new(m.Para, EstadosEmail.Enviado, Url: enlace);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Falló el envío a {Para} por la API de Mailpit", m.Para);
                    resultados[i] = new(m.Para, EstadosEmail.Fallido, "No se pudo enviar a la bandeja de pruebas.");
                }
            });

        logger.LogInformation("Email Mailpit: {Enviados}/{Total} enviado(s) «{Asunto}»",
            indices.Count(i => resultados[i].Estado == EstadosEmail.Enviado), indices.Count, mensajes[indices[0]].Asunto);
    }

    private object CuerpoApi(MensajeEmail m) => new
    {
        From = new { Email = opt.Remitente, Name = opt.NombreRemitente },
        To = new[] { new { Email = m.Para.Trim(), Name = m.NombrePara ?? string.Empty } },
        Subject = m.Asunto,
        HTML = m.Html,
        Text = HtmlATexto(m.Html),
        Tags = string.IsNullOrWhiteSpace(opt.Etiqueta) ? Array.Empty<string>() : [opt.Etiqueta],
        Attachments = m.Adjuntos
            .Select(a => new { Content = Convert.ToBase64String(a.Contenido), Filename = a.Nombre, a.ContentType })
            .ToArray(),
    };

    private sealed record RespuestaMailpit(string? ID);

    private async Task EnviarPorSmtpAsync(
        IReadOnlyList<MensajeEmail> mensajes, List<int> indices, ResultadoEmail[] resultados, CancellationToken ct)
    {
        using var smtp = new SmtpClient { Timeout = 30_000 };
        try
        {
            await smtp.ConnectAsync(opt.Smtp.Host!, opt.Smtp.Puerto, Seguridad(), ct);
            if (!string.IsNullOrWhiteSpace(opt.Smtp.Usuario))
                await smtp.AuthenticateAsync(opt.Smtp.Usuario, opt.Smtp.Contrasena ?? string.Empty, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "No se pudo conectar al servidor SMTP {Host}:{Puerto}", opt.Smtp.Host, opt.Smtp.Puerto);
            foreach (int i in indices)
                resultados[i] = new(mensajes[i].Para, EstadosEmail.Fallido, "No se pudo conectar con el servidor de correo.");
            return;
        }

        foreach (int i in indices)
        {
            try
            {
                string respuesta = await smtp.SendAsync(Construir(mensajes[i]), ct);
                resultados[i] = new(mensajes[i].Para, EstadosEmail.Enviado, Url: UrlMensaje(respuesta));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Falló el envío a {Para}", mensajes[i].Para);
                resultados[i] = new(mensajes[i].Para, EstadosEmail.Fallido, ex.Message);
            }
        }

        await smtp.DisconnectAsync(true, ct);
        logger.LogInformation("Email SMTP: {Enviados}/{Total} enviado(s) «{Asunto}»",
            indices.Count(i => resultados[i].Estado == EstadosEmail.Enviado), indices.Count, mensajes[indices[0]].Asunto);
    }

    private MimeMessage Construir(MensajeEmail m)
    {
        var mensaje = new MimeMessage();
        mensaje.From.Add(new MailboxAddress(opt.NombreRemitente, opt.Remitente));
        mensaje.To.Add(new MailboxAddress(m.NombrePara ?? string.Empty, m.Para.Trim()));
        mensaje.Subject = m.Asunto;
        if (!string.IsNullOrWhiteSpace(opt.Etiqueta)) mensaje.Headers.Add("X-Tags", opt.Etiqueta);

        var cuerpo = new BodyBuilder { HtmlBody = m.Html, TextBody = HtmlATexto(m.Html) };
        foreach (var adjunto in m.Adjuntos)
            cuerpo.Attachments.Add(adjunto.Nombre, adjunto.Contenido, ContentType.Parse(adjunto.ContentType));

        mensaje.Body = cuerpo.ToMessageBody();
        return mensaje;
    }

    /// <summary>Mailpit responde "Ok: queued as &lt;id&gt;"; ese id abre el mensaje en su bandeja.</summary>
    private string? UrlMensaje(string respuestaSmtp)
        => opt.EsSandbox && UrlBandeja is { } bandeja && IdEnCola().Match(respuestaSmtp) is { Success: true } m
            ? $"{bandeja}/view/{m.Groups[1].Value}"
            : null;

    [GeneratedRegex(@"queued as ([A-Za-z0-9]+)")]
    private static partial Regex IdEnCola();

    private SecureSocketOptions Seguridad() => opt.Smtp.Seguridad.Trim().ToLowerInvariant() switch
    {
        "starttls" => SecureSocketOptions.StartTls,
        "sslonconnect" or "ssl" => SecureSocketOptions.SslOnConnect,
        "none" => SecureSocketOptions.None,
        _ => SecureSocketOptions.Auto,
    };

    private static string HtmlATexto(string html)
    {
        string texto = Etiquetas().Replace(SaltosHtml().Replace(html, "\n"), string.Empty);
        return WebUtility.HtmlDecode(texto).Trim();
    }

    [GeneratedRegex(@"<\s*(br|/p|/div|/h\d|/li|/tr)\s*/?>", RegexOptions.IgnoreCase)]
    private static partial Regex SaltosHtml();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex Etiquetas();
}

/// <summary>Marco HTML común de los correos salientes (marca + pie).</summary>
public static class EmailLayout
{
    public static string Envolver(string contenidoHtml, string? pie = null) => $$"""
        <!doctype html>
        <html lang="es">
        <body style="margin:0;padding:24px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#262626">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden">
                <tr><td style="background:#151515;padding:20px 28px;font-size:24px;font-weight:bold;color:#ffffff">
                  c<span style="color:#ffa62b">o</span>mpi<span style="color:#ffa62b">pro</span>
                </td></tr>
                <tr><td style="padding:28px;font-size:15px;line-height:1.6">{{contenidoHtml}}</td></tr>
                <tr><td style="padding:16px 28px;background:#fafaf9;font-size:12px;color:#737373">
                  {{pie ?? "Enviado desde el CRM de Compipro S.A.C."}}
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    /// <summary>Texto plano escrito por un usuario → HTML seguro (escapa y respeta saltos de línea).</summary>
    public static string TextoAHtml(string texto)
        => WebUtility.HtmlEncode(texto.Trim()).Replace("\r\n", "\n").Replace("\n", "<br>");
}
