using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Domain;

namespace Server.Services;

public interface IEmailCampaignService
{
    Task<CampanaEmail?> SendAsync(int id, string? actor, CancellationToken ct);
}

/// <summary>
/// Envío de campañas. Es una simulación: no envía correos reales, solo calcula
/// destinatarios y métricas de ejemplo. Aquí se integraría un proveedor SMTP/API.
/// </summary>
public sealed class EmailCampaignService(AppDbContext db, IAuditService audit) : IEmailCampaignService
{
    public async Task<CampanaEmail?> SendAsync(int id, string? actor, CancellationToken ct)
    {
        var campana = await db.CampanasEmail.FindAsync([id], ct);
        if (campana is null) return null;

        int destinatarios = await db.Clientes.CountAsync(c => c.Estado == "Activo" && c.Email != null, ct);
        campana.Destinatarios = destinatarios;
        campana.Enviados = destinatarios;
        campana.Aperturas = (int)(destinatarios * 0.42);
        campana.Clicks = (int)(destinatarios * 0.11);
        campana.Estado = "Enviada";
        campana.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(actor, "Enviar", nameof(CampanaEmail), id, ct: ct);
        return campana;
    }
}
