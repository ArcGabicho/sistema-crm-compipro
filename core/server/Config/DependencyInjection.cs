using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Server.Data;
using Server.Services;

namespace Server.Config;

/// <summary>Registro de servicios y pipeline HTTP del CRM (mantiene Program.cs mínimo).</summary>
public static class DependencyInjection
{
    public const string CorsPolicyName = "client";

    public static WebApplicationBuilder AddCrm(this WebApplicationBuilder builder)
    {
        IServiceCollection services = builder.Services;
        IConfiguration config = builder.Configuration;

        services.AddOpenApi();

        services.AddControllers(o => o.Filters.Add<PermisosFilter>()).AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            o.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
        });

        // --- Opciones ---------------------------------------------------
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        services.Configure<SeedOptions>(config.GetSection(SeedOptions.SectionName));
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.SectionName));
        services.Configure<AlmacenamientoOptions>(config.GetSection(AlmacenamientoOptions.SectionName));

        // --- Límites contra abuso (por IP y bloqueo de cuentas) ---------
        services.AddLimites(config);
        services.AddMemoryCache(o => o.SizeLimit = 50_000);
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<BloqueoLogin>();

        // --- Persistencia (EF Core + SQL Server) ---------------------
        string connectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException(
                "Falta 'ConnectionStrings:Default' (o env 'ConnectionStrings__Default').");
        services.AddDbContext<AppDbContext>(o =>
            o.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

        // Esquema + siembra en segundo plano: el servidor atiende apenas arranca.
        services.AddSingleton<EstadoArranque>();
        services.AddHostedService<InicializadorBaseDatos>();

        // --- Servicios de dominio -----------------------------------
        services.AddScoped(typeof(ICrudService<>), typeof(CrudService<>));
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IEmailCampaignService, EmailCampaignService>();
        services.AddScoped<IStatsService, StatsService>();
        services.AddScoped<ICotizacionService, CotizacionService>();
        services.AddScoped<IPedidoService, PedidoService>();
        services.AddScoped<ISolicitudService, SolicitudService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddSingleton<ITokenService, TokenService>();

        // --- Correo, archivos, exportación y PDF ---------------------
        services.AddHttpClient(nameof(EmailSender), c => c.Timeout = TimeSpan.FromSeconds(90));
        services.AddSingleton<IEmailSender, EmailSender>();
        services.AddSingleton<SeguimientoEmail>();
        services.AddSingleton<ProgramadorCampanas>();
        services.AddHostedService(sp => sp.GetRequiredService<ProgramadorCampanas>());
        services.AddSingleton<IExportService, ExportService>();
        services.AddScoped<IDocumentoService, DocumentoService>();
        services.AddScoped<ICotizacionDocumentoService, CotizacionDocumentoService>();

        string proveedor = config.GetSection(AlmacenamientoOptions.SectionName).Get<AlmacenamientoOptions>()?.Proveedor ?? "Local";
        if (proveedor.Equals("S3", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IAlmacenamientoArchivos, AlmacenamientoS3>();
        else
            services.AddSingleton<IAlmacenamientoArchivos, AlmacenamientoLocal>();

        // QuestPDF es gratuito para personas y empresas con ingresos < 1 M USD/año.
        QuestPDF.Settings.License = LicenseType.Community;

        // --- Autenticación / Autorización -------------------------
        var jwt = config.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        if (string.IsNullOrWhiteSpace(jwt.Key))
        {
            throw new InvalidOperationException(
                "Falta 'Jwt:Key'. Defínelo en appsettings.json o con la variable 'Jwt__Key'.");
        }

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    NameClaimType = "email",
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });
        services.AddAuthorization();

        // --- CORS para el cliente Next.js -------------------------
        string[] allowedOrigins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000"];
        services.AddCors(o => o.AddPolicy(CorsPolicyName, p =>
            p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

        return builder;
    }

    public static WebApplication UseCrm(this WebApplication app)
    {
        // Mientras InicializadorBaseDatos prepara la base, la API responde 503 (el BFF reintenta).
        app.Use(async (ctx, next) =>
        {
            if (ctx.Request.Path == "/" || ctx.RequestServices.GetRequiredService<EstadoArranque>().Listo)
            {
                await next(ctx);
                return;
            }
            ctx.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            ctx.Response.Headers.RetryAfter = "5";
            await ctx.Response.WriteAsJsonAsync(new
            {
                message = "La demo se está iniciando. Vuelve a intentarlo en unos segundos.",
                reintentarEn = 5,
            });
        });

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseCors(CorsPolicyName);
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapGet("/", (EstadoArranque estado) =>
                Results.Ok(new { service = "compipro-crm-api", status = estado.Listo ? "ok" : "iniciando" }))
            .ExcludeFromDescription();
        app.MapControllers();

        return app;
    }
}
