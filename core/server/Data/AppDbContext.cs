using Microsoft.EntityFrameworkCore;
using Server.Domain;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TipoCliente> TiposCliente => Set<TipoCliente>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Envio> Envios => Set<Envio>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<Cotizacion> Cotizaciones => Set<Cotizacion>();
    public DbSet<CotizacionItem> CotizacionItems => Set<CotizacionItem>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<PlantillaEmail> PlantillasEmail => Set<PlantillaEmail>();
    public DbSet<CampanaEmail> CampanasEmail => Set<CampanaEmail>();
    public DbSet<Evento> Eventos => Set<Evento>();
    public DbSet<ParticipanteEvento> ParticipantesEvento => Set<ParticipanteEvento>();
    public DbSet<Configuracion> Configuraciones => Set<Configuracion>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<RegistroAsistencia> RegistrosAsistencia => Set<RegistroAsistencia>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.Property(u => u.Name).HasMaxLength(200).IsRequired();
            e.Property(u => u.Role).HasMaxLength(50).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(400).IsRequired();
        });

        b.Entity<TipoCliente>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(120).IsRequired();
            e.Property(x => x.Color).HasMaxLength(20);
            e.Property(x => x.DescuentoPct).HasPrecision(5, 2);
        });

        b.Entity<Cliente>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.Telefono).HasMaxLength(60);
            e.Property(x => x.Direccion).HasMaxLength(300);
            e.Property(x => x.Ciudad).HasMaxLength(120);
            e.Property(x => x.Region).HasMaxLength(120);
            e.Property(x => x.Estado).HasMaxLength(30).IsRequired();
            e.Property(x => x.TotalCompras).HasPrecision(14, 2);
            e.Property(x => x.ExternalId).HasMaxLength(40);
            e.Property(x => x.RazonSocial).HasMaxLength(250);
            e.Property(x => x.Ruc).HasMaxLength(20);
            e.Property(x => x.Rubro).HasMaxLength(250);
            e.Property(x => x.Contacto).HasMaxLength(200);
            e.Property(x => x.Cargo).HasMaxLength(150);
            e.Property(x => x.PaginaWeb).HasMaxLength(300);
            e.Property(x => x.Etapa).HasMaxLength(80);
            e.Property(x => x.MedioContacto).HasMaxLength(60);
            e.Property(x => x.Vendedor).HasMaxLength(150);
            e.Property(x => x.Notas).HasMaxLength(1000);
            e.HasOne(x => x.TipoCliente).WithMany().HasForeignKey(x => x.TipoClienteId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.Estado);
            e.HasIndex(x => x.ExternalId);
        });

        b.Entity<Venta>(e =>
        {
            e.Property(x => x.Monto).HasPrecision(14, 2);
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.Fecha);
        });

        b.Entity<Ticket>(e =>
        {
            e.Property(x => x.Asunto).HasMaxLength(200).IsRequired();
            e.Property(x => x.Estado).HasMaxLength(30).IsRequired();
            e.Property(x => x.Prioridad).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.AsignadoA).WithMany().HasForeignKey(x => x.AsignadoAId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Proveedor>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.TerminosPago).HasMaxLength(60);
        });

        b.Entity<Envio>(e =>
        {
            e.Property(x => x.Direccion).HasMaxLength(300).IsRequired();
            e.Property(x => x.Estado).HasMaxLength(30).IsRequired();
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Producto>(e =>
        {
            e.Property(x => x.Sku).HasMaxLength(60).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.Precio).HasPrecision(14, 2);
            e.Property(x => x.TecnicasDisponibles).HasMaxLength(300);
            e.HasIndex(x => x.Sku).IsUnique();
        });

        b.Entity<Cotizacion>(e =>
        {
            e.Property(x => x.Codigo).HasMaxLength(30).IsRequired();
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notas).HasMaxLength(1000);
            e.Property(x => x.Subtotal).HasPrecision(14, 2);
            e.Property(x => x.Igv).HasPrecision(14, 2);
            e.Property(x => x.Total).HasPrecision(14, 2);
            e.HasIndex(x => x.Codigo).IsUnique();
            e.HasIndex(x => x.Estado);
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Vendedor).WithMany().HasForeignKey(x => x.VendedorId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Items).WithOne(i => i.Cotizacion!).HasForeignKey(i => i.CotizacionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CotizacionItem>(e =>
        {
            e.Property(x => x.Descripcion).HasMaxLength(300).IsRequired();
            e.Property(x => x.Tecnica).HasMaxLength(40);
            e.Property(x => x.PrecioUnitario).HasPrecision(14, 2);
            e.Property(x => x.Subtotal).HasPrecision(14, 2);
            e.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Pedido>(e =>
        {
            e.Property(x => x.Codigo).HasMaxLength(30).IsRequired();
            e.Property(x => x.EstadoProduccion).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notas).HasMaxLength(1000);
            e.Property(x => x.Total).HasPrecision(14, 2);
            e.Property(x => x.Pagado).HasPrecision(14, 2);
            e.HasIndex(x => x.Codigo).IsUnique();
            e.HasIndex(x => x.EstadoProduccion);
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Cotizacion).WithMany().HasForeignKey(x => x.CotizacionId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<MovimientoInventario>(e =>
        {
            e.Property(x => x.Tipo).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Documento>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(300).IsRequired();
            e.Property(x => x.Carpeta).HasMaxLength(120).IsRequired();
            e.Property(x => x.Url).HasMaxLength(1000);
        });

        b.Entity<PlantillaEmail>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(160).IsRequired();
            e.Property(x => x.Asunto).HasMaxLength(300).IsRequired();
        });

        b.Entity<CampanaEmail>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Plantilla).WithMany().HasForeignKey(x => x.PlantillaId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Evento>(e => e.Property(x => x.Nombre).HasMaxLength(200).IsRequired());

        b.Entity<ParticipanteEvento>(e =>
        {
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.Rol).HasMaxLength(40);
            e.Property(x => x.Stand).HasMaxLength(40);
            e.HasOne(x => x.Evento).WithMany().HasForeignKey(x => x.EventoId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Configuracion>(e =>
        {
            e.Property(x => x.Clave).HasMaxLength(120).IsRequired();
            e.HasIndex(x => x.Clave).IsUnique();
        });

        b.Entity<AuditLog>(e =>
        {
            e.Property(x => x.Accion).HasMaxLength(40).IsRequired();
            e.Property(x => x.Entidad).HasMaxLength(60).IsRequired();
            e.Property(x => x.UserEmail).HasMaxLength(256);
            e.Property(x => x.Detalle).HasMaxLength(1000);
        });

        b.Entity<RegistroAsistencia>(e =>
        {
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Justificacion).HasMaxLength(500);
            e.HasIndex(x => new { x.UserId, x.Fecha }).IsUnique();
            e.HasIndex(x => x.Fecha);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Solicitud>(e =>
        {
            e.Property(x => x.Tipo).HasMaxLength(20).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            e.Property(x => x.Empresa).HasMaxLength(200);
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.Telefono).HasMaxLength(60);
            e.Property(x => x.Mensaje).HasMaxLength(2000);
            e.Property(x => x.ProductoNombre).HasMaxLength(200);
            e.Property(x => x.Categoria).HasMaxLength(120);
            e.Property(x => x.Direccion).HasMaxLength(300);
            e.Property(x => x.Ciudad).HasMaxLength(120);
            e.Property(x => x.CodigoPostal).HasMaxLength(20);
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Origen).HasMaxLength(40).IsRequired();
            e.Property(x => x.Notas).HasMaxLength(1000);
            e.HasIndex(x => x.Estado);
            e.HasIndex(x => x.Tipo);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
