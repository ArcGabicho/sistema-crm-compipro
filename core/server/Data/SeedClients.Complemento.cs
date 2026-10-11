using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Server.Domain;

namespace Server.Data;

public static partial class SeedClients
{
    /// <summary>
    /// Importa <see cref="ClientSeedData"/> sin duplicar: solo inserta los contactos cuya
    /// empresa (RUC o, si no hay, nombre) + contacto aún no existen en la base. Es
    /// idempotente, así que puede correr en cada arranque.
    /// </summary>
    public static async Task SeedComplementoAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        var existentes = await db.Clientes
            .AsNoTracking()
            .Select(c => new { c.Nombre, c.Ruc, c.Contacto })
            .ToListAsync(ct);

        var claves = new HashSet<string>(existentes.Select(c => Clave(c.Ruc, c.Nombre, c.Contacto)));
        var nuevos = new List<Cliente>();

        foreach (ClientSeedRow r in ClientSeedData.Clients)
        {
            string? nombre = Primero(r.CompanyName, r.LegalName);
            if (nombre is null)
            {
                continue;
            }

            string? contacto = Primero($"{r.FirstName} {r.LastName}");
            if (!claves.Add(Clave(r.TaxId, nombre, contacto)))
            {
                continue;
            }

            string? ciudad = Primero(r.District, r.Province);
            nuevos.Add(new Cliente
            {
                Nombre = nombre,
                Estado = "Prospecto",
                Etapa = "Contacto Inicial-1",
                RazonSocial = Primero(r.LegalName),
                Ruc = Primero(r.TaxId),
                Rubro = Primero(r.Industry),
                Contacto = contacto,
                Cargo = Primero(r.JobTitle),
                Email = Primero(r.Email),
                Telefono = Primero(r.PhoneNumber),
                PaginaWeb = Primero(r.Website),
                Direccion = Primero(r.Address),
                Ciudad = ciudad,
                Region = Primero(r.Province),
                CreatedAt = new DateTimeOffset(DateTime.SpecifyKind(r.CreatedAt, DateTimeKind.Utc)),
            });
        }

        if (nuevos.Count == 0)
        {
            return;
        }

        const int batchSize = 500;
        for (int i = 0; i < nuevos.Count; i += batchSize)
        {
            db.Clientes.AddRange(nuevos.GetRange(i, Math.Min(batchSize, nuevos.Count - i)));
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }

        logger.LogInformation("Clientes complementarios importados: {Count}", nuevos.Count);
    }

    private static string? Primero(params string?[] valores) =>
        valores.Select(v => v?.Trim()).FirstOrDefault(v => !string.IsNullOrEmpty(v));

    // RUC si existe; si no, el nombre normalizado. Más los tokens del contacto sin importar el orden.
    private static string Clave(string? ruc, string? nombre, string? contacto)
    {
        string empresa = string.IsNullOrWhiteSpace(ruc) ? string.Concat(Tokens(nombre)) : ruc.Trim();
        return empresa + "|" + string.Join(' ', Tokens(contacto));
    }

    private static IEnumerable<string> Tokens(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
        {
            return [];
        }

        var sb = new StringBuilder(texto.Length);
        foreach (char ch in texto.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            sb.Append(char.IsLetterOrDigit(ch) ? char.ToUpperInvariant(ch) : ' ');
        }

        return sb.ToString()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Order(StringComparer.Ordinal);
    }
}
