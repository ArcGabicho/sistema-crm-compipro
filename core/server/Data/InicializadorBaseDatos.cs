using Microsoft.Extensions.Options;
using Server.Config;
using Server.Services;

namespace Server.Data;

/// <summary>
/// Prepara la base (esquema y siembra) en segundo plano para no retrasar el arranque.
/// Si no lo logra tras los reintentos, detiene la app: la plataforma (Container Apps,
/// Docker) la reinicia en un contenedor nuevo.
/// </summary>
public sealed class InicializadorBaseDatos(
    IServiceProvider services,
    IOptions<SeedOptions> seed,
    EstadoArranque estado,
    IHostApplicationLifetime vida,
    ILogger<InicializadorBaseDatos> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield(); // no bloquear el arranque del servidor HTTP
        try
        {
            await DbInitializer.InitializeAsync(services, seed.Value, logger, stoppingToken);
            estado.MarcarListo();
            logger.LogInformation("Base de datos lista.");
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "No se pudo preparar la base de datos; la app se detiene para reiniciarse.");
            Environment.ExitCode = 1;
            vida.StopApplication();
        }
    }
}
