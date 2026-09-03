namespace Server.Domain;

public class Producto : BaseEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Categoria { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public int StockMinimo { get; set; }

    // Datos propios de merchandising personalizado
    /// <summary>Técnicas de personalización aplicables, separadas por coma.</summary>
    public string? TecnicasDisponibles { get; set; }
    public int MinimoPedido { get; set; } = 1;
    public int DiasProduccion { get; set; } = 7;
}

/// <summary>Asiento del kardex; al crearse ajusta el stock del producto.</summary>
public class MovimientoInventario : BaseEntity
{
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public string Tipo { get; set; } = "Entrada"; // Entrada | Salida | Ajuste
    public int Cantidad { get; set; }
    public string? Motivo { get; set; }
    public int StockResultante { get; set; }
}
