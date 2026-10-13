namespace Server.Config;

/// <summary>
/// Dónde se guardan los archivos subidos (sección <c>Almacenamiento</c>).
/// <c>Local</c> usa el disco del servidor (montar un volumen en Docker);
/// <c>S3</c> sirve para Cloudflare R2, AWS S3, MinIO o cualquier compatible.
/// </summary>
public sealed class AlmacenamientoOptions
{
    public const string SectionName = "Almacenamiento";

    /// <summary>Local | S3</summary>
    public string Proveedor { get; set; } = "Local";

    /// <summary>Tamaño máximo por archivo. Vercel limita el cuerpo de las peticiones a 4,5 MB.</summary>
    public long MaxBytes { get; set; } = 4 * 1024 * 1024;

    public LocalStorageOptions Local { get; set; } = new();
    public S3StorageOptions S3 { get; set; } = new();
}

public sealed class LocalStorageOptions
{
    /// <summary>Carpeta raíz; relativa al directorio de la app si no es absoluta.</summary>
    public string Ruta { get; set; } = "storage";
}

public sealed class S3StorageOptions
{
    /// <summary>Endpoint del servicio, p. ej. https://&lt;cuenta&gt;.r2.cloudflarestorage.com. Vacío = AWS.</summary>
    public string? Endpoint { get; set; }
    public string Region { get; set; } = "auto";
    public string? Bucket { get; set; }
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
}
