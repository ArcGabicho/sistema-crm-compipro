using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Config;
using Server.Data;
using Server.Domain;

namespace Server.Services;

public sealed record ArchivoDescargable(Stream Contenido, string ContentType, string Nombre);

public interface IDocumentoService
{
    /// <summary>Sube un archivo nuevo o, con <paramref name="documentoId"/>, una nueva versión.</summary>
    Task<(Documento? Documento, string? Error)> SubirAsync(
        IFormFile? archivo, string? carpeta, int? documentoId, string? actor, CancellationToken ct);

    Task<(ArchivoDescargable? Archivo, string? Error)> AbrirAsync(int id, CancellationToken ct);

    Task<bool> EliminarAsync(int id, string? actor, CancellationToken ct);
}

/// <summary>
/// Archivos del repositorio de documentos. El archivo vive en el almacén
/// configurado y <see cref="Documento.Url"/> guarda su clave con el prefijo
/// <c>archivo:</c>; una URL http(s) es un enlace externo.
/// </summary>
public sealed class DocumentoService(
    AppDbContext db,
    IAlmacenamientoArchivos almacen,
    IAuditService audit,
    IOptions<AlmacenamientoOptions> options) : IDocumentoService
{
    public const string PrefijoArchivo = "archivo:";

    private static readonly FileExtensionContentTypeProvider TiposMime = new();

    public async Task<(Documento? Documento, string? Error)> SubirAsync(
        IFormFile? archivo, string? carpeta, int? documentoId, string? actor, CancellationToken ct)
    {
        if (archivo is null) return (null, "Selecciona un archivo.");
        if (archivo.Length == 0) return (null, "El archivo está vacío.");

        long max = options.Value.MaxBytes;
        if (archivo.Length > max) return (null, $"El archivo supera el máximo de {max / (1024 * 1024)} MB.");

        Documento? doc = null;
        if (documentoId is { } id)
        {
            doc = await db.Documentos.FindAsync([id], ct);
            if (doc is null) return (null, "El documento ya no existe.");
        }

        string nombre = Path.GetFileName(archivo.FileName).Trim();
        if (string.IsNullOrEmpty(nombre)) nombre = "archivo";
        string extension = Path.GetExtension(nombre).ToLowerInvariant();
        string clave = $"documentos/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{extension}";

        // Copia en memoria (máx. unos MB): el SDK de S3 necesita conocer el tamaño.
        await using (var contenido = new MemoryStream((int)archivo.Length))
        {
            await archivo.CopyToAsync(contenido, ct);
            contenido.Position = 0;
            await almacen.GuardarAsync(clave, contenido, ContentType(nombre), ct);
        }

        string? claveAnterior = ClaveDe(doc?.Url);
        if (doc is null)
        {
            doc = new Documento
            {
                Carpeta = string.IsNullOrWhiteSpace(carpeta) ? "General" : carpeta.Trim(),
                Version = 1,
                CreatedAt = DateTimeOffset.UtcNow,
            };
            db.Documentos.Add(doc);
        }
        else
        {
            doc.Version += 1;
            doc.UpdatedAt = DateTimeOffset.UtcNow;
            if (!string.IsNullOrWhiteSpace(carpeta)) doc.Carpeta = carpeta.Trim();
        }

        doc.Nombre = nombre;
        doc.Tipo = extension.TrimStart('.') is { Length: > 0 } tipo ? tipo : null;
        doc.TamanoBytes = archivo.Length;
        doc.Url = PrefijoArchivo + clave;
        await db.SaveChangesAsync(ct);

        // Solo se conserva la versión vigente del archivo.
        if (claveAnterior is not null) await almacen.EliminarAsync(claveAnterior, ct);

        await audit.LogAsync(actor, documentoId is null ? "Subir" : "NuevaVersion", nameof(Documento), doc.Id,
            $"{nombre} ({archivo.Length} bytes, v{doc.Version})", ct);
        return (doc, null);
    }

    public async Task<(ArchivoDescargable? Archivo, string? Error)> AbrirAsync(int id, CancellationToken ct)
    {
        var doc = await db.Documentos.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id, ct);
        if (doc is null) return (null, null);

        string? clave = ClaveDe(doc.Url);
        if (clave is null)
            return (null, "Este documento no tiene un archivo adjunto. Súbele una versión con «Nueva versión».");

        var contenido = await almacen.AbrirAsync(clave, ct);
        if (contenido is null) return (null, "No se encontró el archivo en el almacenamiento.");

        return (new ArchivoDescargable(contenido, ContentType(doc.Nombre), doc.Nombre), null);
    }

    public async Task<bool> EliminarAsync(int id, string? actor, CancellationToken ct)
    {
        var doc = await db.Documentos.FindAsync([id], ct);
        if (doc is null) return false;

        string? clave = ClaveDe(doc.Url);
        db.Documentos.Remove(doc);
        await db.SaveChangesAsync(ct);
        if (clave is not null) await almacen.EliminarAsync(clave, ct);

        await audit.LogAsync(actor, "Eliminar", nameof(Documento), id, doc.Nombre, ct);
        return true;
    }

    private static string? ClaveDe(string? url)
        => url is not null && url.StartsWith(PrefijoArchivo, StringComparison.Ordinal) ? url[PrefijoArchivo.Length..] : null;

    private static string ContentType(string nombre)
        => TiposMime.TryGetContentType(nombre, out string? tipo) ? tipo : "application/octet-stream";
}
