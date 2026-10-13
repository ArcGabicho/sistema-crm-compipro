using System.Net;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using Server.Config;

namespace Server.Services;

/// <summary>Almacén de archivos subidos, direccionados por una clave relativa.</summary>
public interface IAlmacenamientoArchivos
{
    string Proveedor { get; }

    Task GuardarAsync(string clave, Stream contenido, string contentType, CancellationToken ct);

    /// <summary>Contenido del archivo, o null si no existe.</summary>
    Task<Stream?> AbrirAsync(string clave, CancellationToken ct);

    Task EliminarAsync(string clave, CancellationToken ct);
}

/// <summary>Disco local del servidor. En Docker, monta un volumen en la carpeta configurada.</summary>
public sealed class AlmacenamientoLocal : IAlmacenamientoArchivos
{
    private readonly string raiz;

    public AlmacenamientoLocal(IOptions<AlmacenamientoOptions> options, IWebHostEnvironment env)
    {
        string ruta = options.Value.Local.Ruta;
        raiz = Path.GetFullPath(Path.IsPathRooted(ruta) ? ruta : Path.Combine(env.ContentRootPath, ruta));
        Directory.CreateDirectory(raiz);
    }

    public string Proveedor => "Local";

    public async Task GuardarAsync(string clave, Stream contenido, string contentType, CancellationToken ct)
    {
        string ruta = Ruta(clave);
        Directory.CreateDirectory(Path.GetDirectoryName(ruta)!);
        await using var archivo = File.Create(ruta);
        await contenido.CopyToAsync(archivo, ct);
    }

    public Task<Stream?> AbrirAsync(string clave, CancellationToken ct)
    {
        string ruta = Ruta(clave);
        return Task.FromResult<Stream?>(File.Exists(ruta) ? File.OpenRead(ruta) : null);
    }

    public Task EliminarAsync(string clave, CancellationToken ct)
    {
        string ruta = Ruta(clave);
        if (File.Exists(ruta)) File.Delete(ruta);
        return Task.CompletedTask;
    }

    // Impide que una clave manipulada ("../") salga de la carpeta raíz.
    private string Ruta(string clave)
    {
        string ruta = Path.GetFullPath(Path.Combine(raiz, clave));
        if (!ruta.StartsWith(raiz + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ArgumentException("Clave de archivo inválida.", nameof(clave));
        return ruta;
    }
}

/// <summary>Cualquier servicio compatible con S3: Cloudflare R2, AWS S3, MinIO, Backblaze B2…</summary>
public sealed class AlmacenamientoS3 : IAlmacenamientoArchivos, IDisposable
{
    private readonly AmazonS3Client cliente;
    private readonly string bucket;
    private readonly bool https;

    public AlmacenamientoS3(IOptions<AlmacenamientoOptions> options)
    {
        var s3 = options.Value.S3;
        if (string.IsNullOrWhiteSpace(s3.Bucket) || string.IsNullOrWhiteSpace(s3.AccessKey) || string.IsNullOrWhiteSpace(s3.SecretKey))
            throw new InvalidOperationException("Almacenamiento S3: faltan Bucket, AccessKey o SecretKey.");

        var config = new AmazonS3Config
        {
            // R2 y MinIO no aceptan los checksums que el SDK v4 envía por defecto.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };
        if (string.IsNullOrWhiteSpace(s3.Endpoint))
        {
            config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(s3.Region);
        }
        else
        {
            config.ServiceURL = s3.Endpoint;
            config.ForcePathStyle = true;
            config.AuthenticationRegion = s3.Region;
        }

        cliente = new AmazonS3Client(new BasicAWSCredentials(s3.AccessKey, s3.SecretKey), config);
        bucket = s3.Bucket;
        https = s3.Endpoint is null || s3.Endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
    }

    public string Proveedor => "S3";

    public async Task GuardarAsync(string clave, Stream contenido, string contentType, CancellationToken ct)
    {
        await cliente.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucket,
            Key = clave,
            InputStream = contenido,
            ContentType = contentType,
            UseChunkEncoding = false,
            DisablePayloadSigning = https,
            AutoCloseStream = false,
        }, ct);
    }

    public async Task<Stream?> AbrirAsync(string clave, CancellationToken ct)
    {
        try
        {
            using var respuesta = await cliente.GetObjectAsync(bucket, clave, ct);
            var copia = new MemoryStream();
            await respuesta.ResponseStream.CopyToAsync(copia, ct);
            copia.Position = 0;
            return copia;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public Task EliminarAsync(string clave, CancellationToken ct)
        => cliente.DeleteObjectAsync(bucket, clave, ct);

    public void Dispose() => cliente.Dispose();
}
