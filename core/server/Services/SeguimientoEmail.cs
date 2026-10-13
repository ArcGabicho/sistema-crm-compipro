using System.Buffers.Text;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Server.Config;

namespace Server.Services;

/// <summary>
/// Seguimiento de campañas: añade un píxel de apertura y reescribe los enlaces
/// para contar clics. Las URLs van firmadas (HMAC) para que el endpoint de clic
/// no sirva como redirección abierta. Requiere <c>Email:UrlPublica</c>.
/// </summary>
public sealed partial class SeguimientoEmail(IOptions<EmailOptions> email, IOptions<JwtOptions> jwt)
{
    private readonly string? baseUrl = email.Value.UrlPublica?.Trim().TrimEnd('/');
    private readonly byte[] clave = SHA256.HashData(Encoding.UTF8.GetBytes("seguimiento-email|" + jwt.Value.Key));

    public bool Activo => !string.IsNullOrWhiteSpace(baseUrl);

    public string Instrumentar(string html, int campanaId)
    {
        if (!Activo) return html;

        string conEnlaces = Enlaces().Replace(html, m =>
            $"href=\"{WebUtility.HtmlEncode(UrlClic(campanaId, WebUtility.HtmlDecode(m.Groups[1].Value)))}\"");
        string pixel = WebUtility.HtmlEncode($"{baseUrl}/api/public/email/abierto?c={campanaId}&s={Firma($"a|{campanaId}")}");
        return conEnlaces + $"<img src=\"{pixel}\" width=\"1\" height=\"1\" alt=\"\" style=\"display:block;border:0\">";
    }

    public bool ValidarApertura(int campanaId, string? firma) => Igual(firma, Firma($"a|{campanaId}"));

    public bool ValidarClic(int campanaId, string url, string? firma) => Igual(firma, Firma($"c|{campanaId}|{url}"));

    private string UrlClic(int campanaId, string url)
        => $"{baseUrl}/api/public/email/clic?c={campanaId}&u={Uri.EscapeDataString(url)}&s={Firma($"c|{campanaId}|{url}")}";

    private string Firma(string datos)
        => Base64Url.EncodeToString(HMACSHA256.HashData(clave, Encoding.UTF8.GetBytes(datos)).AsSpan(0, 16));

    private static bool Igual(string? recibida, string esperada)
        => recibida is not null
           && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(recibida), Encoding.ASCII.GetBytes(esperada));

    [GeneratedRegex("href=\"(https?://[^\"]+)\"", RegexOptions.IgnoreCase)]
    private static partial Regex Enlaces();
}
