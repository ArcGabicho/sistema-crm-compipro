using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Server.Domain;

namespace Server.Data;

/// <summary>
/// Importa los clientes reales al arrancar la aplicación.
/// Los datos viven como código C# en <c>SeedClients.ClientesData.cs</c>
/// (JSON compacto con claves cortas); aquí se deserializan e insertan con EF Core.
/// </summary>
public static partial class SeedClients
{
    private sealed record ClienteRaw
    {
        [JsonPropertyName("ext")] public string? ExternalId { get; init; }
        [JsonPropertyName("nom")] public string? Nombre { get; init; }
        [JsonPropertyName("est")] public string? Estado { get; init; }
        [JsonPropertyName("rs")] public string? RazonSocial { get; init; }
        [JsonPropertyName("ruc")] public string? Ruc { get; init; }
        [JsonPropertyName("rub")] public string? Rubro { get; init; }
        [JsonPropertyName("con")] public string? Contacto { get; init; }
        [JsonPropertyName("car")] public string? Cargo { get; init; }
        [JsonPropertyName("eml")] public string? Email { get; init; }
        [JsonPropertyName("tel")] public string? Telefono { get; init; }
        [JsonPropertyName("web")] public string? PaginaWeb { get; init; }
        [JsonPropertyName("dir")] public string? Direccion { get; init; }
        [JsonPropertyName("cds")] public string? Ciudad { get; init; }
        [JsonPropertyName("reg")] public string? Region { get; init; }
        [JsonPropertyName("etp")] public string? Etapa { get; init; }
        [JsonPropertyName("med")] public string? MedioContacto { get; init; }
        [JsonPropertyName("vnd")] public string? Vendedor { get; init; }
        [JsonPropertyName("not")] public string? Notas { get; init; }
    }

    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        // Idempotente: si ya hay clientes importados, no hace nada.
        if (await db.Clientes.AnyAsync(c => c.ExternalId != null, ct))
        {
            return;
        }

        var registros = JsonSerializer.Deserialize<List<ClienteRaw>>(ClientesJson) ?? [];
        if (registros.Count == 0)
        {
            logger.LogWarning("SeedClients: no hay registros para importar.");
            return;
        }

        var clientes = registros
            .Where(r => !string.IsNullOrWhiteSpace(r.Nombre))
            .Select(r => new Cliente
            {
                ExternalId = r.ExternalId,
                Nombre = r.Nombre!,
                Estado = string.IsNullOrWhiteSpace(r.Estado) ? "Prospecto" : r.Estado!,
                RazonSocial = r.RazonSocial,
                Ruc = r.Ruc,
                Rubro = r.Rubro,
                Contacto = r.Contacto,
                Cargo = r.Cargo,
                Email = r.Email,
                Telefono = r.Telefono,
                PaginaWeb = r.PaginaWeb,
                Direccion = r.Direccion,
                Ciudad = r.Ciudad,
                Region = r.Region,
                Etapa = r.Etapa,
                MedioContacto = r.MedioContacto,
                Vendedor = r.Vendedor,
                Notas = r.Notas,
                CreatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();

        const int batchSize = 500;
        for (int i = 0; i < clientes.Count; i += batchSize)
        {
            db.Clientes.AddRange(clientes.GetRange(i, Math.Min(batchSize, clientes.Count - i)));
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }

        logger.LogInformation("Clientes importados: {Count}", clientes.Count);
    }
}
