namespace Server.Domain;

/// <summary>Categoría/segmento de cliente (Mayorista, Corporativo, …).</summary>
public class TipoCliente : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal DescuentoPct { get; set; }
    public string Color { get; set; } = "#64748b";
}

public class Cliente : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? Region { get; set; }
    public string Estado { get; set; } = "Prospecto"; // Activo | Inactivo | Prospecto | Moroso
    public int? TipoClienteId { get; set; }
    public TipoCliente? TipoCliente { get; set; }
    public decimal TotalCompras { get; set; }

    // Datos provenientes de la importación (Data/SeedClients.ClientesData.cs)
    public string? ExternalId { get; set; }
    public string? RazonSocial { get; set; }
    public string? Ruc { get; set; }
    public string? Rubro { get; set; }
    public string? Contacto { get; set; }
    public string? Cargo { get; set; }
    public string? PaginaWeb { get; set; }
    public string? Etapa { get; set; }
    public string? MedioContacto { get; set; }
    public string? Vendedor { get; set; }
    public string? Notas { get; set; }
}

/// <summary>Venta registrada a un cliente (historial y estadísticas).</summary>
public class Venta : BaseEntity
{
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public decimal Monto { get; set; }
    public DateOnly Fecha { get; set; }
    public string? Detalle { get; set; }
}
