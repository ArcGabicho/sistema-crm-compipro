namespace Server.Services;

/// <summary>
/// Envía las campañas programadas cuando llega su hora. No consulta la base
/// periódicamente (eso impediría que Azure SQL serverless se pause y gastaría
/// su cuota gratuita): calcula la próxima fecha al arrancar y espera hasta ella.
/// Cada alta o cambio de campaña llama a <see cref="Reprogramar"/>.
/// </summary>
public sealed class ProgramadorCampanas(
    IServiceScopeFactory scopes, EstadoArranque arranque, ILogger<ProgramadorCampanas> logger)
    : BackgroundService
{
    private static readonly TimeSpan EsperaMaxima = TimeSpan.FromDays(20); // límite de Task.Delay ≈ 24,8 días
    private static readonly TimeSpan EsperaTrasError = TimeSpan.FromMinutes(5);

    private readonly SemaphoreSlim aviso = new(0, 1);

    /// <summary>Recalcula la próxima fecha (tras crear, editar o borrar una campaña).</summary>
    public void Reprogramar()
    {
        if (aviso.CurrentCount == 0)
        {
            try { aviso.Release(); } catch (SemaphoreFullException) { /* ya había un aviso pendiente */ }
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await arranque.EsperarAsync(stoppingToken); // la base se prepara en segundo plano
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            TimeSpan espera;
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var campanas = scope.ServiceProvider.GetRequiredService<IEmailCampaignService>();

                int enviadas = await campanas.EnviarProgramadasAsync(stoppingToken);
                if (enviadas > 0) logger.LogInformation("Campañas programadas enviadas: {Cantidad}", enviadas);

                DateTimeOffset? proxima = await campanas.ProximaProgramadaAsync(stoppingToken);
                espera = proxima is null
                    ? Timeout.InfiniteTimeSpan
                    : Min(Max(proxima.Value - DateTimeOffset.UtcNow, TimeSpan.Zero), EsperaMaxima);
                if (proxima is not null)
                    logger.LogInformation("Próxima campaña programada: {Fecha:u}", proxima);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "No se pudieron revisar las campañas programadas; se reintenta en 5 min.");
                espera = EsperaTrasError;
            }

            try
            {
                await aviso.WaitAsync(espera, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    private static TimeSpan Min(TimeSpan a, TimeSpan b) => a < b ? a : b;

    private static TimeSpan Max(TimeSpan a, TimeSpan b) => a > b ? a : b;

    public override void Dispose()
    {
        aviso.Dispose();
        base.Dispose();
    }
}
