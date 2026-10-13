using System.Collections.Concurrent;
using System.Globalization;
using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Server.Models;

namespace Server.Services;

public sealed record ArchivoExportado(byte[] Contenido, string ContentType, string Nombre);

public interface IExportService
{
    /// <summary>Genera un .xlsx (por defecto) o .csv con una columna por propiedad.</summary>
    ArchivoExportado Exportar<T>(IReadOnlyList<T> filas, string? formato, string nombreBase);
}

/// <summary>
/// Exportación genérica a Excel (ClosedXML) o CSV. Las columnas salen de las
/// propiedades de la entidad: valores simples tal cual y las relaciones por su
/// nombre (p. ej. <c>Cliente</c> → nombre del cliente). Fechas en hora de Perú.
/// </summary>
public sealed partial class ExportService : IExportService
{
    public const int MaxFilas = 20_000;

    private static readonly TimeSpan HoraPeru = TimeSpan.FromHours(-5);
    private static readonly ConcurrentDictionary<Type, Columna[]> Cache = new();

    private static readonly Dictionary<string, string> Palabras = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Id"] = "ID", ["Ruc"] = "RUC", ["Igv"] = "IGV", ["Url"] = "URL", ["Html"] = "HTML", ["Pct"] = "%",
        ["Telefono"] = "Teléfono", ["Direccion"] = "Dirección", ["Region"] = "Región", ["Razon"] = "Razón",
        ["Codigo"] = "Código", ["Pagina"] = "Página", ["Ubicacion"] = "Ubicación", ["Descripcion"] = "Descripción",
        ["Categoria"] = "Categoría", ["Tamano"] = "Tamaño", ["Version"] = "Versión", ["Asistio"] = "Asistió",
        ["Tecnica"] = "Técnica", ["Tecnicas"] = "Técnicas", ["Minimo"] = "Mínimo", ["Numero"] = "Número",
        ["Valida"] = "Válida", ["Produccion"] = "Producción", ["Compania"] = "Compañía", ["Accion"] = "Acción",
        ["Calificacion"] = "Calificación", ["Prioridad"] = "Prioridad", ["Envio"] = "Envío", ["Guia"] = "Guía",
    };

    private sealed record Columna(string Titulo, Func<object, object?> Valor, Type Tipo);

    public ArchivoExportado Exportar<T>(IReadOnlyList<T> filas, string? formato, string nombreBase)
    {
        var columnas = Columnas(typeof(T));
        string marca = DateTimeOffset.UtcNow.ToOffset(HoraPeru).ToString("yyyyMMdd-HHmm", CultureInfo.InvariantCulture);

        return string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase)
            ? new ArchivoExportado(Csv(filas, columnas), "text/csv; charset=utf-8", $"{nombreBase}-{marca}.csv")
            : new ArchivoExportado(Xlsx(filas, columnas, nombreBase),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{nombreBase}-{marca}.xlsx");
    }

    /// <summary>Recorre un listado paginado completo (para servicios que limitan el tamaño de página).</summary>
    public static async Task<List<T>> TodasLasPaginas<T>(Func<int, Task<PagedResult<T>>> pagina)
    {
        var todas = new List<T>();
        for (int n = 1; todas.Count < MaxFilas; n++)
        {
            var actual = await pagina(n);
            todas.AddRange(actual.Items);
            if (actual.Items.Count == 0 || todas.Count >= actual.Total) break;
        }
        return todas.Count > MaxFilas ? todas[..MaxFilas] : todas;
    }

    private static byte[] Xlsx<T>(IReadOnlyList<T> filas, Columna[] columnas, string nombreHoja)
    {
        string titulo = char.ToUpperInvariant(nombreHoja[0]) + nombreHoja[1..].Replace('-', ' ');
        using var libro = new XLWorkbook();
        var hoja = libro.Worksheets.Add(titulo.Length > 31 ? titulo[..31] : titulo);

        for (int c = 0; c < columnas.Length; c++)
        {
            var celda = hoja.Cell(1, c + 1);
            celda.Value = columnas[c].Titulo;
            celda.Style.Font.Bold = true;
            celda.Style.Fill.BackgroundColor = XLColor.FromHtml("#F4F4F2");
        }

        for (int f = 0; f < filas.Count; f++)
        {
            for (int c = 0; c < columnas.Length; c++)
            {
                var celda = hoja.Cell(f + 2, c + 1);
                switch (Normalizar(columnas[c].Valor(filas[f]!)))
                {
                    case null: break;
                    case DateTime fecha:
                        celda.Value = fecha;
                        celda.Style.DateFormat.Format = fecha.TimeOfDay == TimeSpan.Zero ? "dd/mm/yyyy" : "dd/mm/yyyy hh:mm";
                        break;
                    case decimal d: celda.Value = d; break;
                    case double d: celda.Value = d; break;
                    case long n: celda.Value = n; break;
                    case int n: celda.Value = n; break;
                    case string s: celda.Value = s; break;
                    case var otro: celda.Value = Convert.ToString(otro, CultureInfo.InvariantCulture); break;
                }
            }
        }

        if (filas.Count > 0) hoja.Range(1, 1, filas.Count + 1, columnas.Length).SetAutoFilter();
        hoja.SheetView.FreezeRows(1);
        // Medir solo las primeras filas: con miles de filas AdjustToContents es lento.
        hoja.Columns(1, columnas.Length).AdjustToContents(1, Math.Min(filas.Count + 1, 300));
        foreach (var columna in hoja.Columns(1, columnas.Length))
            if (columna.Width > 60) columna.Width = 60;

        using var salida = new MemoryStream();
        libro.SaveAs(salida);
        return salida.ToArray();
    }

    private static byte[] Csv<T>(IReadOnlyList<T> filas, Columna[] columnas)
    {
        var sb = new StringBuilder();
        sb.AppendJoin(',', columnas.Select(c => Escapar(c.Titulo))).Append("\r\n");
        foreach (var fila in filas)
        {
            sb.AppendJoin(',', columnas.Select(c => Escapar(Normalizar(c.Valor(fila!)) switch
            {
                null => string.Empty,
                DateTime fecha => fecha.ToString(fecha.TimeOfDay == TimeSpan.Zero ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                IFormattable n => n.ToString(null, CultureInfo.InvariantCulture),
                var otro => otro.ToString() ?? string.Empty,
            }))).Append("\r\n");
        }

        // BOM para que Excel abra el archivo como UTF-8 (tildes y ñ).
        return [.. Encoding.UTF8.GetPreamble(), .. Encoding.UTF8.GetBytes(sb.ToString())];
    }

    private static string Escapar(string valor)
        => valor.IndexOfAny([',', '"', '\n', '\r']) >= 0 ? $"\"{valor.Replace("\"", "\"\"")}\"" : valor;

    /// <summary>Lleva cada valor a un tipo que Excel/CSV entienden.</summary>
    private static object? Normalizar(object? valor) => valor switch
    {
        null => null,
        DateTimeOffset dto => dto.ToOffset(HoraPeru).DateTime,
        DateOnly d => d.ToDateTime(TimeOnly.MinValue),
        TimeOnly t => t.ToString("HH:mm", CultureInfo.InvariantCulture),
        bool b => b ? "Sí" : "No",
        Enum e => e.ToString(),
        float f => (double)f,
        short or byte => Convert.ToInt32(valor, CultureInfo.InvariantCulture),
        _ => valor,
    };

    private static Columna[] Columnas(Type tipo) => Cache.GetOrAdd(tipo, t =>
    {
        var props = t.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead && p.GetIndexParameters().Length == 0 && p.GetCustomAttribute<JsonIgnoreAttribute>() is null)
            .ToList();
        var nombres = props.Select(p => p.Name).ToHashSet();

        var columnas = new List<(int Orden, Columna Columna)>();
        foreach (var p in props)
        {
            Type tipoProp = Nullable.GetUnderlyingType(p.PropertyType) ?? p.PropertyType;
            int orden = p.Name switch { "Id" => 0, "CreatedAt" => 2, "UpdatedAt" => 3, _ => 1 };

            if (EsSimple(tipoProp))
            {
                // "ClienteId" sobra si existe la relación "Cliente" (se exporta su nombre).
                if (p.Name.Length > 2 && p.Name.EndsWith("Id", StringComparison.Ordinal) && nombres.Contains(p.Name[..^2])) continue;
                string titulo = p.Name switch { "CreatedAt" => "Creado", "UpdatedAt" => "Actualizado", _ => Titulo(p.Name) };
                columnas.Add((orden, new Columna(titulo, p.GetValue, tipoProp)));
            }
            else if (tipoProp.IsClass && tipoProp != typeof(string) && !typeof(System.Collections.IEnumerable).IsAssignableFrom(tipoProp)
                     && (tipoProp.GetProperty("Nombre") ?? tipoProp.GetProperty("Name")) is { } etiqueta)
            {
                columnas.Add((orden, new Columna(Titulo(p.Name), o => p.GetValue(o) is { } rel ? etiqueta.GetValue(rel) : null, typeof(string))));
            }
        }

        return columnas.OrderBy(c => c.Orden).Select(c => c.Columna).ToArray();
    });

    private static bool EsSimple(Type t)
        => t.IsPrimitive || t.IsEnum || t == typeof(string) || t == typeof(decimal) || t == typeof(DateTime)
           || t == typeof(DateTimeOffset) || t == typeof(DateOnly) || t == typeof(TimeOnly) || t == typeof(Guid);

    /// <summary>"TotalCompras" → "Total compras"; "Telefono" → "Teléfono".</summary>
    private static string Titulo(string nombre)
    {
        var palabras = PalabrasPascal().Matches(nombre.Replace(" ", string.Empty))
            .Select(m => Palabras.TryGetValue(m.Value, out var bonita) ? bonita : m.Value)
            // Siglas (RUC, IGV…) intactas; el resto en minúscula salvo la primera palabra.
            .Select((p, i) => p.All(c => !char.IsLetter(c) || char.IsUpper(c)) && p.Length > 1 ? p
                : i == 0 ? char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant() : p.ToLowerInvariant())
            .ToList();
        return palabras.Count == 0 ? nombre : string.Join(' ', palabras);
    }

    [GeneratedRegex("[A-Z]+(?![a-z])|[A-Z]?[a-z]+|[0-9]+")]
    private static partial Regex PalabrasPascal();
}
