using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;

namespace Server.Services;

public sealed record ResultadoCampana(CampanaEmail Campana, int Reales, int Simulados, int Fallidos);

public interface IEmailCampaignService
{
    Task<(ResultadoCampana? Resultado, string? Error)> SendAsync(int id, string? actor, CancellationToken ct);

    /// <summary>Envía la campaña a una sola dirección, sin afectar sus métricas.</summary>
    Task<(ResultadoEmail? Resultado, string? Error)> EnviarPruebaAsync(int id, string para, string? actor, CancellationToken ct);

    /// <summary>Envía las campañas programadas cuya fecha ya llegó. Devuelve cuántas envió.</summary>
    Task<int> EnviarProgramadasAsync(CancellationToken ct);

    /// <summary>Fecha de la próxima campaña programada pendiente, si hay.</summary>
    Task<DateTimeOffset?> ProximaProgramadaAsync(CancellationToken ct);

    Task RegistrarAperturaAsync(int id, CancellationToken ct);

    Task RegistrarClicAsync(int id, CancellationToken ct);
}

/// <summary>
/// Envío de campañas a los clientes activos con email. Los destinatarios reales
/// salen por SMTP con seguimiento de aperturas y clics; los de demostración
/// (dominios reservados) se simulan y sus métricas se estiman con tasas típicas.
/// </summary>
public sealed class EmailCampaignService(
    AppDbContext db,
    IAuditService audit,
    IEmailSender sender,
    SeguimientoEmail seguimiento,
    ILogger<EmailCampaignService> logger) : IEmailCampaignService
{
    private const string Enviando = "Enviando";
    private const string Enviada = "Enviada";
    private const string Programada = "Programada";

    // Tasas de referencia para campañas B2B, usadas solo en envíos simulados.
    private const double TasaApertura = 0.42;
    private const double TasaClic = 0.11;

    public async Task<(ResultadoCampana? Resultado, string? Error)> SendAsync(int id, string? actor, CancellationToken ct)
    {
        var previo = await db.CampanasEmail.AsNoTracking()
            .Where(c => c.Id == id).Select(c => new { c.Estado, c.PlantillaId }).FirstOrDefaultAsync(ct);
        if (previo is null) return (null, null);
        if (previo.Estado is Enviada or Enviando) return (null, "La campaña ya fue enviada.");
        if (previo.PlantillaId is null) return (null, "Asigna una plantilla a la campaña antes de enviarla.");

        // Reserva atómica: evita que dos instancias (o el programador y un clic) la envíen dos veces.
        int reservada = await db.CampanasEmail
            .Where(c => c.Id == id && c.Estado != Enviada && c.Estado != Enviando)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Estado, Enviando), ct);
        if (reservada == 0) return (null, "La campaña ya fue enviada.");

        try
        {
            var campana = await db.CampanasEmail.Include(c => c.Plantilla).FirstAsync(c => c.Id == id, ct);
            var destinatarios = await db.Clientes.AsNoTracking()
                .Where(c => c.Estado == "Activo" && c.Email != null && c.Email != "")
                .Select(c => new Destinatario(c.Email!, c.Nombre, c.Contacto))
                .ToListAsync(ct);

            var mensajes = destinatarios
                .Select(d => Mensaje(campana, d, instrumentar: sender.EnviaDeVerdad(d.Email)))
                .ToList();
            var resultados = await sender.EnviarAsync(mensajes, ct);

            int reales = resultados.Count(r => r.Estado == EstadosEmail.Enviado);
            int simulados = resultados.Count(r => r.Estado == EstadosEmail.Simulado);
            int fallidos = resultados.Count(r => r.Estado == EstadosEmail.Fallido);

            campana.Destinatarios = destinatarios.Count;
            campana.Enviados = reales + simulados;
            // Las aperturas y clics reales llegan después, con el píxel y los enlaces de seguimiento.
            campana.Aperturas = (int)Math.Round(simulados * TasaApertura);
            campana.Clicks = (int)Math.Round(simulados * TasaClic);
            campana.Estado = Enviada;
            campana.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);

            await audit.LogAsync(actor, "Enviar", nameof(CampanaEmail), id,
                $"{reales} reales, {simulados} simulados, {fallidos} fallidos", ct);
            return (new ResultadoCampana(campana, reales, simulados, fallidos), null);
        }
        catch
        {
            await db.CampanasEmail.Where(c => c.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.Estado, previo.Estado), CancellationToken.None);
            throw;
        }
    }

    public async Task<(ResultadoEmail? Resultado, string? Error)> EnviarPruebaAsync(
        int id, string para, string? actor, CancellationToken ct)
    {
        if (!EmailSender.EsEmailValido(para)) return (null, "Escribe un email válido para la prueba.");

        var campana = await db.CampanasEmail.AsNoTracking().Include(c => c.Plantilla)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        if (campana is null) return (null, null);
        if (campana.Plantilla is null) return (null, "Asigna una plantilla a la campaña antes de probarla.");

        var mensaje = Mensaje(campana, new Destinatario(para.Trim(), "Empresa de prueba S.A.C.", "Cliente de prueba"), instrumentar: false);
        var resultado = await sender.EnviarAsync(mensaje with { Asunto = $"[Prueba] {mensaje.Asunto}" }, ct);

        await audit.LogAsync(actor, "EnviarPrueba", nameof(CampanaEmail), id, $"{para.Trim()}: {resultado.Estado}", ct);
        return resultado.Ok ? (resultado, null) : (null, resultado.Error ?? "No se pudo enviar la prueba.");
    }

    public async Task<int> EnviarProgramadasAsync(CancellationToken ct)
    {
        var ahora = DateTimeOffset.UtcNow;
        var vencidas = await db.CampanasEmail.AsNoTracking()
            .Where(c => c.Estado == Programada && c.ProgramadaPara != null && c.ProgramadaPara <= ahora)
            .Select(c => c.Id)
            .ToListAsync(ct);

        int enviadas = 0;
        foreach (int id in vencidas)
        {
            var (resultado, error) = await SendAsync(id, "programador", ct);
            if (resultado is not null)
            {
                enviadas++;
                continue;
            }

            // Vuelve a borrador para no reintentarla en bucle (p. ej. no tiene plantilla).
            logger.LogWarning("Campaña programada {Id} no enviada: {Error}", id, error);
            await db.CampanasEmail.Where(c => c.Id == id && c.Estado == Programada)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.Estado, "Borrador"), ct);
        }
        return enviadas;
    }

    public Task<DateTimeOffset?> ProximaProgramadaAsync(CancellationToken ct)
        => db.CampanasEmail.AsNoTracking()
            .Where(c => c.Estado == Programada && c.ProgramadaPara != null)
            .MinAsync(c => c.ProgramadaPara, ct);

    public Task RegistrarAperturaAsync(int id, CancellationToken ct)
        => db.CampanasEmail.Where(c => c.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Aperturas, c => c.Aperturas + 1), ct);

    public Task RegistrarClicAsync(int id, CancellationToken ct)
        => db.CampanasEmail.Where(c => c.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Clicks, c => c.Clicks + 1), ct);

    private sealed record Destinatario(string Email, string Empresa, string? Contacto);

    /// <summary>Personaliza asunto y cuerpo: {{nombre}}, {{empresa}} y {{email}}.</summary>
    private MensajeEmail Mensaje(CampanaEmail campana, Destinatario d, bool instrumentar)
    {
        string nombre = string.IsNullOrWhiteSpace(d.Contacto) ? d.Empresa : d.Contacto;
        string Personalizar(string texto) => texto
            .Replace("{{nombre}}", nombre, StringComparison.OrdinalIgnoreCase)
            .Replace("{{empresa}}", d.Empresa, StringComparison.OrdinalIgnoreCase)
            .Replace("{{email}}", d.Email, StringComparison.OrdinalIgnoreCase);

        var plantilla = campana.Plantilla!;
        string cuerpo = Personalizar(plantilla.CuerpoHtml);
        if (instrumentar) cuerpo = seguimiento.Instrumentar(cuerpo, campana.Id);

        return new MensajeEmail(d.Email, Personalizar(plantilla.Asunto), EmailLayout.Envolver(cuerpo,
            "Recibes este correo porque eres cliente de Compipro S.A.C."), nombre);
    }
}
