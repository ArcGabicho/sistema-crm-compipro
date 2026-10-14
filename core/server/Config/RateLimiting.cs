using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Server.Config;

/// <summary>Políticas de límite de peticiones por IP del visitante.</summary>
public static class RateLimiting
{
    public const string Login = "login";
    public const string Publico = "publico";

    public const string CabeceraIp = "X-Cliente-IP";
    public const string CabeceraClave = "X-BFF-Clave";

    public static IServiceCollection AddLimites(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<LimitesOptions>(config.GetSection(LimitesOptions.SectionName));
        var limites = config.GetSection(LimitesOptions.SectionName).Get<LimitesOptions>() ?? new LimitesOptions();

        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                PorMinuto(IpCliente(ctx), limites.GeneralPorMinuto));
            o.AddPolicy(Login, ctx => PorMinuto(IpCliente(ctx), limites.LoginPorMinuto));
            o.AddPolicy(Publico, ctx => PorMinuto(IpCliente(ctx), limites.PublicoPorMinuto));
            o.OnRejected = async (contexto, ct) =>
            {
                int segundos = contexto.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan espera)
                    ? (int)Math.Ceiling(espera.TotalSeconds)
                    : 60;
                contexto.HttpContext.Response.Headers.RetryAfter = segundos.ToString();
                await contexto.HttpContext.Response.WriteAsJsonAsync(new
                {
                    message = $"Demasiadas solicitudes. Inténtalo de nuevo en {Espera(segundos)}.",
                    reintentarEn = segundos,
                }, ct);
            };
        });

        return services;
    }

    /// <summary>"45 s", "5 min"…</summary>
    public static string Espera(int segundos)
        => segundos < 60 ? $"{segundos} s" : $"{(int)Math.Ceiling(segundos / 60.0)} min";

    /// <summary>
    /// IP real del visitante: la que reenvía el BFF (solo con la clave correcta),
    /// la que pone el proxy de delante (Azure o Cloudflare; el cliente no puede
    /// falsificarla) o la de la conexión.
    /// </summary>
    public static string IpCliente(HttpContext ctx)
    {
        var headers = ctx.Request.Headers;
        LimitesOptions limites = ctx.RequestServices.GetRequiredService<IOptions<LimitesOptions>>().Value;

        if (!string.IsNullOrWhiteSpace(limites.ClaveBff)
            && headers[CabeceraIp].ToString() is { Length: > 0 } reenviada
            && Iguales(headers[CabeceraClave].ToString(), limites.ClaveBff))
        {
            return reenviada;
        }

        // X-Forwarded-For acumula IPs; el proxy agrega la que vio al final.
        if (!string.IsNullOrWhiteSpace(limites.CabeceraIpProxy)
            && headers[limites.CabeceraIpProxy].ToString().Split(',')[^1].Trim() is { Length: > 0 } delProxy)
        {
            return delProxy;
        }

        return ctx.Connection.RemoteIpAddress?.ToString() ?? "desconocida";
    }

    private static RateLimitPartition<string> PorMinuto(string ip, int permitidas)
        => RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitidas,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        });

    private static bool Iguales(string recibida, string esperada)
        => CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(recibida), Encoding.UTF8.GetBytes(esperada));
}
