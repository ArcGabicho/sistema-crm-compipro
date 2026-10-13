using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Server.Config;

namespace Server.Services;

/// <summary>
/// Bloqueo temporal de una cuenta tras varios logins fallidos seguidos. Se cuenta
/// por email (no por IP): el BFF llama desde los servidores de Vercel, así que
/// esto protege cada cuenta venga de donde venga el ataque. Vive en memoria
/// (una sola instancia del backend); un reinicio lo limpia.
/// </summary>
public sealed class BloqueoLogin(IMemoryCache cache, IOptions<LimitesOptions> options, TimeProvider tiempo)
{
    private readonly LimitesOptions opt = options.Value;

    private sealed class Estado
    {
        public int Fallos;
        public DateTimeOffset? Hasta;
    }

    /// <summary>Tiempo que le queda de bloqueo a la cuenta, o null si puede intentar.</summary>
    public TimeSpan? Restante(string email)
    {
        if (!cache.TryGetValue(Clave(email), out Estado? estado) || estado is null) return null;
        lock (estado)
        {
            var resta = estado.Hasta - tiempo.GetUtcNow();
            return resta > TimeSpan.Zero ? resta : null;
        }
    }

    /// <summary>Suma un fallo. Devuelve la duración del bloqueo si con este se alcanzó el máximo.</summary>
    public TimeSpan? RegistrarFallo(string email)
    {
        string clave = Clave(email);
        var estado = cache.GetOrCreate(clave, entrada =>
        {
            entrada.AbsoluteExpirationRelativeToNow = opt.LoginVentana;
            entrada.Size = 1;
            return new Estado();
        })!;

        lock (estado)
        {
            if (++estado.Fallos < opt.LoginMaxFallos) return null;

            estado.Fallos = 0;
            estado.Hasta = tiempo.GetUtcNow() + opt.LoginBloqueo;
            // La entrada debe durar al menos lo que dura el bloqueo.
            cache.Set(clave, estado, new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = estado.Hasta,
                Size = 1,
            });
            return opt.LoginBloqueo;
        }
    }

    public void Limpiar(string email) => cache.Remove(Clave(email));

    private static string Clave(string email) => "login:" + email.Trim().ToLowerInvariant();
}
