namespace Server.Services;

/// <summary>
/// Si la base ya está lista. El servidor atiende peticiones apenas arranca (en Azure
/// Container Apps escala desde cero) y prepara la base por detrás; mientras tanto la
/// API responde 503 para que el BFF muestre que la demo se está despertando y reintente.
/// </summary>
public sealed class EstadoArranque
{
    private readonly TaskCompletionSource listo = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public bool Listo => listo.Task.IsCompleted;

    public void MarcarListo() => listo.TrySetResult();

    public Task EsperarAsync(CancellationToken ct) => listo.Task.WaitAsync(ct);
}
