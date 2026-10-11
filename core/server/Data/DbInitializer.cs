using Microsoft.EntityFrameworkCore;
using Server.Config;
using Server.Domain;
using Server.Services;

namespace Server.Data;

/// <summary>
/// Crea el esquema la primera vez, siembra el administrador, importa los clientes
/// y los datos de ejemplo. Reintenta mientras SQL Server termina de arrancar.
/// </summary>
public static class DbInitializer
{
    public static async Task InitializeAsync(
        IServiceProvider services,
        SeedOptions seed,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        await using AsyncServiceScope scope = services.CreateAsyncScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const int maxAttempts = 20;
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                await db.Database.EnsureCreatedAsync(cancellationToken);
                break;
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                logger.LogWarning(
                    "SQL Server no está listo (intento {Attempt}/{Max}): {Message}",
                    attempt, maxAttempts, ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
            }
        }

        await SeedAdminAsync(db, seed, logger, cancellationToken);

        try
        {
            await SeedClients.SeedAsync(db, logger, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudieron importar los clientes.");
        }

        try
        {
            await SeedClients.SeedComplementoAsync(db, logger, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudieron importar los clientes complementarios.");
        }

        try
        {
            await SeedData.SeedAsync(db, cancellationToken);
            logger.LogInformation("Datos de ejemplo verificados/sembrados.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudieron sembrar los datos de ejemplo.");
        }
    }

    private static async Task SeedAdminAsync(
        AppDbContext db,
        SeedOptions seed,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(seed.Admin.Email) ||
            string.IsNullOrWhiteSpace(seed.Admin.Password))
        {
            logger.LogWarning("No hay 'Seed:Admin' configurado; la tabla Users queda vacía.");
            return;
        }

        db.Users.Add(new User
        {
            Email = seed.Admin.Email.Trim(),
            Name = string.IsNullOrWhiteSpace(seed.Admin.Name) ? "Administrador" : seed.Admin.Name,
            Role = "admin",
            PasswordHash = PasswordHasher.Hash(seed.Admin.Password),
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Usuario administrador sembrado: {Email}", seed.Admin.Email);
    }
}
