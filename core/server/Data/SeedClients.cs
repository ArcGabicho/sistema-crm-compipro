using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Server.Domain;

namespace Server.Data;

/// <summary>
/// Siembra la cartera de demostración: 6.106 clientes ficticios generados con una
/// semilla fija (siempre los mismos). Las proporciones de estados, etapas, rubros,
/// cargos y ubicaciones imitan una cartera real de agencia de merchandising, pero
/// ningún nombre, RUC, correo ni teléfono corresponde a una persona o empresa real.
/// Los correos y webs usan el dominio reservado ".example".
/// </summary>
public static class SeedClients
{
    private const int Total = 6106;
    private const int Semilla = 20241010;

    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        // Idempotente: si ya hay una cartera sembrada, no hace nada.
        if (await db.Clientes.AnyAsync(c => c.ExternalId != null, ct))
        {
            return;
        }

        var rnd = new Random(Semilla);
        var hoy = DateTimeOffset.UtcNow;
        var clientes = new List<Cliente>(Total);

        for (int i = 1; i <= Total; i++)
        {
            string nombre = NombreEmpresa(rnd);
            string slug = Slug(nombre);
            string? contacto = Prob(rnd, 0.97) ? $"{Pick(rnd, Nombres)} {Pick(rnd, Apellidos)}" : null;
            var (ciudad, region) = Ubicacion(rnd);

            clientes.Add(new Cliente
            {
                ExternalId = $"DEMO-{i:00000}",
                Nombre = nombre,
                Estado = Prob(rnd, 0.093) ? "Activo" : "Prospecto",
                RazonSocial = Prob(rnd, 0.77) ? $"{Mayus(nombre)} {Pick(rnd, Sociedades)}" : null,
                Ruc = Prob(rnd, 0.82) ? $"20{rnd.Next(100_000_000, 999_999_999)}" : null,
                Rubro = Prob(rnd, 0.87) ? Pesado(rnd, Rubros) : null,
                Contacto = contacto,
                Cargo = Prob(rnd, 0.80) ? Pesado(rnd, Cargos) : null,
                Email = contacto is not null && Prob(rnd, 0.65) ? $"{Slug(contacto, ".")}@{slug}.example" : null,
                Telefono = Prob(rnd, 0.43) ? Telefono(rnd) : null,
                PaginaWeb = Prob(rnd, 0.63) ? $"www.{slug}.example" : null,
                Direccion = Prob(rnd, 0.55) ? $"{Pick(rnd, Vias)} {rnd.Next(100, 3999)}" : null,
                Ciudad = ciudad,
                Region = region,
                Etapa = Prob(rnd, 0.99) ? Pesado(rnd, Etapas) : null,
                MedioContacto = Prob(rnd, 0.90) ? Pesado(rnd, Medios) : null,
                Vendedor = Pick(rnd, Vendedores),
                Notas = Pick(rnd, Notas),
                CreatedAt = hoy.AddDays(-rnd.Next(1, 3 * 365)).AddMinutes(-rnd.Next(0, 1440)),
            });
        }

        const int batchSize = 500;
        for (int i = 0; i < clientes.Count; i += batchSize)
        {
            db.Clientes.AddRange(clientes.GetRange(i, Math.Min(batchSize, clientes.Count - i)));
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }

        logger.LogInformation("Clientes de demostración sembrados: {Count}", clientes.Count);
    }

    // --- Generadores -------------------------------------------------------------

    private static string NombreEmpresa(Random rnd) => rnd.Next(5) switch
    {
        0 => $"{Pick(rnd, Prefijos)} {Pick(rnd, Giros)}",
        1 => $"{Pick(rnd, Giros)} {Pick(rnd, Apellidos)}",
        2 => $"Grupo {Pick(rnd, Prefijos)}",
        3 => $"Inversiones {Pick(rnd, Apellidos)} & {Pick(rnd, Apellidos)}",
        _ => $"{Pick(rnd, Prefijos)}{Pick(rnd, Sufijos)}",
    };

    private static (string? Ciudad, string? Region) Ubicacion(Random rnd)
    {
        bool conCiudad = Prob(rnd, 0.75);
        bool conRegion = Prob(rnd, 0.59);
        if (Prob(rnd, 0.9))
        {
            string distrito = Pesado(rnd, DistritosLima);
            string region = distrito == "CALLAO" ? "CALLAO" : "LIMA";
            return (conCiudad ? distrito : null, conRegion ? region : null);
        }
        string provincia = Pick(rnd, Provincias);
        return (conCiudad ? provincia : null, conRegion ? provincia : null);
    }

    private static string Telefono(Random rnd) => Prob(rnd, 0.7)
        ? $"9{rnd.Next(10, 99)} {rnd.Next(100, 999)} {rnd.Next(100, 999)}"
        : $"(01) {rnd.Next(200, 799)} {rnd.Next(1000, 9999)}";

    private static bool Prob(Random rnd, double p) => rnd.NextDouble() < p;

    private static T Pick<T>(Random rnd, T[] items) => items[rnd.Next(items.Length)];

    private static string Pesado(Random rnd, (string Valor, int Peso)[] items)
    {
        int total = items.Sum(x => x.Peso);
        int r = rnd.Next(total);
        foreach (var (valor, peso) in items)
        {
            if ((r -= peso) < 0) return valor;
        }
        return items[^1].Valor;
    }

    private static string Mayus(string s) => s.ToUpper(new CultureInfo("es-PE"));

    private static string Slug(string s, string separador = "")
    {
        var sb = new StringBuilder();
        foreach (char ch in s.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsLetterOrDigit(ch)) sb.Append(char.ToLowerInvariant(ch));
            else if (ch == ' ' && sb.Length > 0 && separador.Length > 0 && !sb.ToString().EndsWith(separador)) sb.Append(separador);
        }
        return sb.ToString().Trim('.');
    }

    // --- Catálogos ficticios --------------------------------------------------------

    private static readonly string[] Prefijos =
    [
        "Andina", "Pacífico", "Inca", "Cordillera", "Amazonía", "Sol Naciente", "Costa Verde", "Altiplano",
        "Nexo", "Vértice", "Horizonte", "Cumbre", "Litoral", "Mistura", "Qhapaq", "Wari", "Puma", "Cóndor",
        "Vicuña", "Pachacámac", "Rímac", "Chavín", "Moche", "Paracas", "Nazca", "Huascarán", "Tumbes",
        "Ayni", "Kallpa", "Inti", "Killa", "Sumaq", "Taypi", "Ñan", "Urpi", "Yaku", "Wayra", "Pirka", "Antara", "Kusi",
    ];

    private static readonly string[] Giros =
    [
        "Logística", "Alimentos", "Constructora", "Minera", "Textil", "Tecnologías", "Servicios Generales",
        "Distribuidora", "Farma", "Agroindustrias", "Energía", "Consultores", "Importaciones", "Ingeniería",
        "Inmobiliaria", "Seguridad", "Transportes", "Educación", "Salud", "Telecom", "Plásticos", "Metalmecánica",
        "Automotriz", "Pesquera", "Retail", "Publicidad", "Laboratorios", "Comercial", "Industrias", "Ferretería",
    ];

    private static readonly string[] Sufijos = ["tec", " Group", " Partners", "mar", "corp", " Solutions", "net", " Perú"];

    private static readonly string[] Sociedades = ["S.A.C.", "S.A.C.", "S.A.C.", "S.A.", "E.I.R.L.", "S.R.L."];

    private static readonly string[] Nombres =
    [
        "Ana", "Luis", "María", "Carlos", "Rosa", "Jorge", "Lucía", "Miguel", "Carmen", "José", "Patricia", "Juan",
        "Sofía", "Ricardo", "Elena", "Fernando", "Gabriela", "Víctor", "Daniela", "Andrés", "Valeria", "Raúl",
        "Claudia", "Diego", "Paola", "Alberto", "Karina", "Óscar", "Milagros", "Sergio", "Lorena", "Hugo",
    ];

    private static readonly string[] Apellidos =
    [
        "Quispe", "Flores", "Rojas", "Mamani", "Huamán", "García", "Sánchez", "Torres", "Ramírez", "Castillo",
        "Mendoza", "Vargas", "Chávez", "Ruiz", "Gutiérrez", "Paredes", "Salazar", "Cárdenas", "Vega", "Ríos",
        "Silva", "Medina", "Aguilar", "Herrera", "Espinoza", "Guerrero", "Rivera", "Cruz", "Navarro", "Campos",
    ];

    private static readonly string[] Vendedores =
    [
        "Ana Quispe", "Marta Ríos", "Carlos Medina", "Lucía Paredes", "Jorge Salazar", "Valeria Campos",
        "Renzo Aguilar", "Fiorella Vega",
    ];

    private static readonly string[] Vias =
    [
        "Av. Javier Prado Este", "Av. Larco", "Av. Benavides", "Av. Arequipa", "Av. La Marina", "Av. Primavera",
        "Jr. de la Unión", "Av. Brasil", "Calle Los Pinos", "Av. Angamos Oeste", "Av. Universitaria",
        "Av. Petit Thouars", "Calle Las Begonias", "Av. El Derby", "Av. Separadora Industrial",
    ];

    private static readonly string[] Provincias =
        ["AREQUIPA", "TRUJILLO", "PIURA", "CHICLAYO", "ICA", "CAJAMARCA", "CUSCO", "HUANCAYO", "IQUITOS", "TACNA"];

    private static readonly string[] Notas =
    [
        "Interesado en tomatodos personalizados para evento corporativo.",
        "Solicita catálogo de productos ecológicos.",
        "Llamar nuevamente la próxima semana.",
        "Envió consulta por la web, pendiente de cotizar.",
        "Compra agendas y calendarios cada fin de año.",
        "No contesta; reintentar por correo.",
        "Pidió muestras de polos bordados.",
        "Evalúa kits de bienvenida para nuevos colaboradores.",
        "Cotización enviada, esperando aprobación del área de compras.",
        "Contacto obtenido en feria; enviar presentación.",
        "Requiere factura y entrega en provincia.",
        "Prefiere coordinar por WhatsApp.",
    ];

    private static readonly (string, int)[] Etapas =
    [
        ("Contacto Inicial-1", 3176), ("Retomar Contacto", 1930), ("Cotizado", 398),
        ("Pendientes por Cotizar", 156), ("Venta Realizado", 87), ("Venta No Realizado", 29), ("Prod. Entregado", 8),
    ];

    private static readonly (string, int)[] Medios =
    [
        ("LLAMADAS", 3133), ("OTROS", 802), ("MAILING", 308), ("REFERIDOS", 292), ("CHAT", 278),
        ("PAGINA WEB", 259), ("Ninguno", 152), ("FACEBOOK", 35),
    ];

    private static readonly (string, int)[] Cargos =
    [
        ("MARKETING", 302), ("LOGÍSTICA", 276), ("GERENTE GENERAL", 199), ("COMPRAS", 195), ("ADMINISTRACIÓN", 135),
        ("VENTAS", 81), ("GERENTE", 72), ("COMERCIAL", 68), ("GERENTE COMERCIAL", 54), ("RECURSOS HUMANOS", 85),
        ("JEFE DE MARKETING", 43), ("RECEPCIÓN", 40), ("ANALISTA DE COMPRAS", 36), ("ASISTENTE DE MARKETING", 36),
        ("ASISTENTE DE GERENCIA", 36), ("JEFE DE LOGÍSTICA", 28), ("ASISTENTE ADMINISTRATIVO", 27), ("ANALISTA DE MARKETING", 27),
    ];

    private static readonly (string, int)[] Rubros =
    [
        ("ESTADO", 206), ("VTA. MAY. DE OTROS PRODUCTOS", 107), ("VTA. MAY. MAQUINARIA Y EQUIPO", 102),
        ("FERIA RESMINE 2024", 68), ("EDUCACIÓN", 70), ("CONSTRUCCIÓN", 112), ("SALUD", 57),
        ("ARQUITECTURA E INGENIERÍA", 54), ("AUTOMOTRIZ", 105), ("PUBLICIDAD", 50), ("ASESORAMIENTO EMPRESARIAL", 93),
        ("ALIMENTOS", 60), ("TEXTIL", 29), ("PESCA Y CONSERVAS", 28), ("ENERGÍA ELÉCTRICA", 28), ("MINERÍA", 129),
        ("TELECOMUNICACIONES", 24), ("MATERIALES DE CONSTRUCCIÓN", 24), ("PLÁSTICOS", 23), ("TECNOLOGÍA E INFORMÁTICA", 22),
        ("ACTIVIDADES INMOBILIARIAS", 22), ("TRANSPORTE DE CARGA", 42),
    ];

    private static readonly (string, int)[] DistritosLima =
    [
        ("SAN ISIDRO", 659), ("SANTIAGO DE SURCO", 419), ("MIRAFLORES", 400), ("CALLAO", 241), ("LIMA", 278),
        ("ATE", 230), ("SAN BORJA", 162), ("LA VICTORIA", 149), ("CHORRILLOS", 149), ("SURQUILLO", 117),
        ("JESÚS MARÍA", 101), ("LURÍN", 96), ("SAN MIGUEL", 91), ("MAGDALENA", 81), ("LA MOLINA", 74),
        ("SAN JUAN DE LURIGANCHO", 73), ("LOS OLIVOS", 64), ("LINCE", 59), ("SAN MARTÍN DE PORRES", 59),
        ("VILLA EL SALVADOR", 55), ("SAN JUAN DE MIRAFLORES", 51), ("SANTA ANITA", 49), ("SAN LUIS", 45),
    ];
}
