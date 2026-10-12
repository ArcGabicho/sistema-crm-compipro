using Server.Config;
using Microsoft.EntityFrameworkCore;
using Server.Domain;
using Server.Services;

namespace Server.Data;

/// <summary>Datos de ejemplo para que los módulos y el dashboard tengan contenido.</summary>
public static class SeedData
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        var rnd = new Random(20260903);

        // --- Personal interno (para asignaciones y control de asistencia) ---
        if (await db.Users.CountAsync(ct) <= 1)
        {
            (string name, string email, string role, int h, int m)[] staff =
            [
                ("Ana Quispe", "ana.quispe@compipro.net", Roles.Ventas, 9, 0),
                ("Luis Torres", "luis.torres@compipro.net", Roles.Operaciones, 9, 0),
                ("Marta Ríos", "marta.rios@compipro.net", Roles.Ventas, 8, 30),
                ("Diego Flores", "diego.flores@compipro.net", Roles.Gerencia, 9, 0),
            ];
            foreach (var s in staff)
            {
                if (await db.Users.AnyAsync(u => u.Email == s.email, ct)) continue;
                db.Users.Add(new User
                {
                    Name = s.name,
                    Email = s.email,
                    Role = s.role,
                    HoraEntrada = new TimeOnly(s.h, s.m),
                    PasswordHash = PasswordHasher.Hash("Compipro2025!"),
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Asistencia (últimos días hábiles) --------------------------
        if (!await db.RegistrosAsistencia.AnyAsync(ct))
        {
            var trabajadores = await db.Users.ToListAsync(ct);
            var hoyLima = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-5));
            foreach (var t in trabajadores)
            {
                for (int back = 1; back <= 16; back++)
                {
                    var dia = hoyLima.AddDays(-back);
                    if (dia.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;

                    // ~70% a tiempo; el resto con tardanza (algunas justificadas).
                    int desviacion = rnd.Next(100) < 70
                        ? rnd.Next(-15, 4)
                        : rnd.Next(8, 45);
                    int minutos = Math.Max(0, desviacion);
                    int anticip = Math.Max(0, -desviacion);
                    bool tarde = minutos > 5;
                    bool justificada = tarde && rnd.Next(2) == 0;
                    var ingreso = t.HoraEntrada.AddMinutes(desviacion);

                    db.RegistrosAsistencia.Add(new RegistroAsistencia
                    {
                        UserId = t.Id,
                        Fecha = dia,
                        HoraProgramada = t.HoraEntrada,
                        HoraIngreso = ingreso,
                        MinutosTardanza = minutos,
                        MinutosAnticipacion = anticip,
                        Tarde = tarde,
                        Estado = justificada
                            ? "Justificada"
                            : tarde ? "Tarde" : anticip > 5 ? "Temprano" : "ATiempo",
                        Justificacion = justificada
                            ? new[]
                            {
                                "Tráfico intenso en la vía de Evitamiento.",
                                "Cita médica presentada con anticipación.",
                                "Trámite bancario a primera hora.",
                                "Problema con el transporte público.",
                            }[rnd.Next(4)]
                            : null,
                        JustificadaAt = justificada
                            ? new DateTimeOffset(dia.ToDateTime(new TimeOnly(12, 0)), TimeSpan.Zero)
                            : null,
                    });
                }
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Tipos de cliente ---------------------------------------------
        if (!await db.TiposCliente.AnyAsync(ct))
        {
            db.TiposCliente.AddRange(
                new TipoCliente { Nombre = "Mayorista", Descripcion = "Compra por volumen", DescuentoPct = 15m, Color = "#f59e0b" },
                new TipoCliente { Nombre = "Minorista", Descripcion = "Compra al detalle", DescuentoPct = 0m, Color = "#3b82f6" },
                new TipoCliente { Nombre = "Corporativo", Descripcion = "Empresas y entidades", DescuentoPct = 10m, Color = "#10b981" },
                new TipoCliente { Nombre = "Gobierno", Descripcion = "Sector público", DescuentoPct = 8m, Color = "#8b5cf6" });
            await db.SaveChangesAsync(ct);
        }

        var tipos = await db.TiposCliente.ToListAsync(ct);

        // --- Clientes ------------------------------------------------
        if (!await db.Clientes.AnyAsync(ct))
        {
            string[] nombres = [
                "Comercial Andina", "Distribuidora El Sol", "Grupo Textil Lima", "Ferretería Central",
                "Corporación MYPE", "Municipalidad de Surco", "Importaciones Pacífico", "Bodega Doña Rosa",
                "Tech Solutions SAC", "Editorial Norte", "Clínica San Pablo", "Restaurante La Mar",
                "Constructora Vega", "Farmacias Unidas", "Colegio Los Álamos", "Hotel Miraflores",
                "AgroExport Perú", "Librería Universitaria", "Taller Mecánico RPM", "Panadería La Espiga",
            ];
            string[] ciudades = ["Lima", "Arequipa", "Trujillo", "Cusco", "Piura", "Chiclayo"];
            string[] regiones = ["Costa", "Sierra", "Selva"];
            string[] estados = ["Activo", "Activo", "Activo", "Prospecto", "Inactivo", "Moroso"];

            for (int i = 0; i < nombres.Length; i++)
            {
                db.Clientes.Add(new Cliente
                {
                    Nombre = nombres[i],
                    Email = $"contacto{i + 1}@{nombres[i].Split(' ')[0].ToLowerInvariant()}.pe",
                    Telefono = $"9{rnd.Next(10_000_000, 99_999_999)}",
                    Direccion = $"Av. Principal {rnd.Next(100, 2000)}",
                    Ciudad = ciudades[rnd.Next(ciudades.Length)],
                    Region = regiones[rnd.Next(regiones.Length)],
                    Estado = estados[rnd.Next(estados.Length)],
                    TipoClienteId = tipos[rnd.Next(tipos.Count)].Id,
                });
            }
            await db.SaveChangesAsync(ct);
        }

        var clientes = await db.Clientes.ToListAsync(ct);

        // --- Ventas (12 meses) --------------------------------------
        if (!await db.Ventas.AnyAsync(ct))
        {
            var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
            var inicio = new DateOnly(hoy.Year, hoy.Month, 1).AddMonths(-11);
            for (int m = 0; m < 12; m++)
            {
                var mes = inicio.AddMonths(m);
                int ventasDelMes = rnd.Next(8, 20);
                for (int k = 0; k < ventasDelMes; k++)
                {
                    var cli = clientes[rnd.Next(clientes.Count)];
                    var venta = new Venta
                    {
                        ClienteId = cli.Id,
                        Monto = Math.Round((decimal)(rnd.NextDouble() * 4500 + 300), 2),
                        Fecha = mes.AddDays(rnd.Next(0, 27)),
                        Detalle = "Pedido " + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant(),
                    };
                    db.Ventas.Add(venta);
                    cli.TotalCompras += venta.Monto;
                }
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Proveedores -------------------------------------------
        if (!await db.Proveedores.AnyAsync(ct))
        {
            string[] provs = [
                "Papelera Nacional", "Plásticos del Sur", "Tintas & Color", "Logística Rápida SAC",
                "Textiles Import", "Cartón Corrugado Perú", "Suministros Gráficos", "Metal Pack",
                "EcoInsumos", "Transporte Águila",
            ];
            string[] pagos = ["Contado", "15 días", "30 días", "45 días", "60 días"];
            foreach (var p in provs)
            {
                db.Proveedores.Add(new Proveedor
                {
                    Nombre = p,
                    Contacto = "Ventas " + p.Split(' ')[0],
                    Email = $"ventas@{p.Split(' ')[0].ToLowerInvariant()}.pe",
                    Telefono = $"01{rnd.Next(2_000_000, 7_999_999)}",
                    Ciudad = "Lima",
                    Rating = rnd.Next(2, 6),
                    TerminosPago = pagos[rnd.Next(pagos.Length)],
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Productos --------------------------------------------
        if (!await db.Productos.AnyAsync(ct))
        {
            (string sku, string nombre, string cat)[] prods = [
                ("TAZ-001", "Taza cerámica 11oz", "Cerámica"),
                ("TAZ-002", "Taza mágica", "Cerámica"),
                ("LAP-001", "Lapicero plástico", "Promocionales"),
                ("LAP-002", "Lapicero metálico", "Promocionales"),
                ("USB-016", "USB 16GB bambú", "Tecnología"),
                ("USB-032", "USB 32GB metálico", "Tecnología"),
                ("POL-001", "Polo algodón", "Textil"),
                ("POL-002", "Polo pique", "Textil"),
                ("GOR-001", "Gorra bordada", "Textil"),
                ("MOC-001", "Mochila ejecutiva", "Bolsas"),
                ("BOL-001", "Bolsa ecológica", "Bolsas"),
                ("CUA-001", "Cuaderno A5 anillado", "Papelería"),
                ("AGE-001", "Agenda 2026", "Papelería"),
                ("LLA-001", "Llavero acrílico", "Promocionales"),
                ("TOM-001", "Tomatodo 750ml", "Cerámica"),
            ];
            var tecnicasPorCat = new Dictionary<string, string>
            {
                ["Cerámica"] = "Sublimación,Serigrafía,Calcomanía",
                ["Promocionales"] = "Tampografía,Serigrafía,Grabado láser",
                ["Tecnología"] = "Grabado láser,Tampografía,UV",
                ["Textil"] = "Bordado,Serigrafía,DTF,Transfer",
                ["Bolsas"] = "Serigrafía,Bordado,DTF",
                ["Papelería"] = "Full color,Hot stamping,Serigrafía",
            };
            foreach (var (sku, nombre, cat) in prods)
            {
                int stock = rnd.Next(0, 300);
                db.Productos.Add(new Producto
                {
                    Sku = sku,
                    Nombre = nombre,
                    Categoria = cat,
                    Precio = Math.Round((decimal)(rnd.NextDouble() * 45 + 3), 2),
                    Stock = stock,
                    StockMinimo = rnd.Next(20, 60),
                    TecnicasDisponibles = tecnicasPorCat.GetValueOrDefault(cat, "Serigrafía,Tampografía"),
                    MinimoPedido = new[] { 25, 50, 100, 250 }[rnd.Next(4)],
                    DiasProduccion = new[] { 5, 7, 10, 15, 21 }[rnd.Next(5)],
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Tickets ---------------------------------------------
        if (!await db.Tickets.AnyAsync(ct))
        {
            string[] asuntos = [
                "Pedido no llegó completo", "Consulta de cotización", "Producto con falla",
                "Solicitud de cambio de diseño", "Retraso en la entrega", "Factura incorrecta",
                "Consulta de stock", "Reclamo por atención", "Solicitud de devolución", "Ampliación de crédito",
            ];
            string[] est = ["Abierto", "EnProceso", "Resuelto", "Cerrado"];
            string[] pri = ["Baja", "Media", "Alta", "Urgente"];
            var admin = await db.Users.FirstOrDefaultAsync(ct);
            foreach (var a in asuntos)
            {
                db.Tickets.Add(new Ticket
                {
                    Asunto = a,
                    Descripcion = "Detalle del caso reportado por el cliente.",
                    Estado = est[rnd.Next(est.Length)],
                    Prioridad = pri[rnd.Next(pri.Length)],
                    ClienteId = clientes[rnd.Next(clientes.Count)].Id,
                    AsignadoAId = admin?.Id,
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Envíos --------------------------------------------
        if (!await db.Envios.AnyAsync(ct))
        {
            string[] est = ["Preparando", "EnRuta", "Entregado", "Devuelto"];
            string[] trans = ["Olva Courier", "Shalom", "Marvisur", "Interno"];
            string[] rutas = ["Lima Norte", "Lima Sur", "Lima Este", "Provincias"];
            for (int i = 0; i < 12; i++)
            {
                var cli = clientes[rnd.Next(clientes.Count)];
                db.Envios.Add(new Envio
                {
                    ClienteId = cli.Id,
                    Direccion = cli.Direccion ?? "Sin dirección",
                    Estado = est[rnd.Next(est.Length)],
                    Transportista = trans[rnd.Next(trans.Length)],
                    Tracking = "TRK" + rnd.Next(100000, 999999),
                    Ruta = rutas[rnd.Next(rutas.Length)],
                    FechaEstimada = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(rnd.Next(-3, 8))),
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Documentos ---------------------------------------
        if (!await db.Documentos.AnyAsync(ct))
        {
            (string nombre, string carpeta, string tipo)[] docs = [
                ("Catálogo 2026.pdf", "Comercial", "pdf"),
                ("Contrato marco proveedores.docx", "Legal", "docx"),
                ("Política de calidad.pdf", "Calidad", "pdf"),
                ("Lista de precios mayorista.xlsx", "Comercial", "xlsx"),
                ("Manual de marca.pdf", "Marketing", "pdf"),
                ("Acta feria 2024.docx", "Eventos", "docx"),
                ("Reporte de ventas Q1.xlsx", "Reportes", "xlsx"),
            ];
            foreach (var (nombre, carpeta, tipo) in docs)
            {
                db.Documentos.Add(new Documento
                {
                    Nombre = nombre,
                    Carpeta = carpeta,
                    Tipo = tipo,
                    TamanoBytes = rnd.Next(50_000, 5_000_000),
                    Version = rnd.Next(1, 4),
                    Url = "#",
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Plantillas y campañas de email ------------------
        if (!await db.PlantillasEmail.AnyAsync(ct))
        {
            db.PlantillasEmail.AddRange(
                new PlantillaEmail { Nombre = "Bienvenida", Asunto = "¡Bienvenido a Compipro!", CuerpoHtml = "<p>Gracias por confiar en nosotros.</p>" },
                new PlantillaEmail { Nombre = "Promoción mensual", Asunto = "Ofertas del mes", CuerpoHtml = "<p>Descuentos exclusivos para ti.</p>" },
                new PlantillaEmail { Nombre = "Recordatorio de pago", Asunto = "Factura pendiente", CuerpoHtml = "<p>Te recordamos tu saldo pendiente.</p>" });
            await db.SaveChangesAsync(ct);
        }
        if (!await db.CampanasEmail.AnyAsync(ct))
        {
            var plantillas = await db.PlantillasEmail.ToListAsync(ct);
            db.CampanasEmail.AddRange(
                new CampanaEmail { Nombre = "Campaña Bienvenida Julio", PlantillaId = plantillas[0].Id, Estado = "Enviada", Destinatarios = 120, Enviados = 120, Aperturas = 54, Clicks = 13 },
                new CampanaEmail { Nombre = "Promo Fiestas Patrias", PlantillaId = plantillas[1].Id, Estado = "Programada", ProgramadaPara = DateTimeOffset.UtcNow.AddDays(3) },
                new CampanaEmail { Nombre = "Cobranza morosos", PlantillaId = plantillas[2].Id, Estado = "Borrador" });
            await db.SaveChangesAsync(ct);
        }

        // --- Feria Resmine 2024 + participantes --------------
        if (!await db.Eventos.AnyAsync(ct))
        {
            var evento = new Evento
            {
                Nombre = "Feria Resmine 2024",
                Ubicacion = "Centro de Convenciones de Lima",
                FechaInicio = new DateOnly(2024, 9, 18),
                FechaFin = new DateOnly(2024, 9, 20),
            };
            db.Eventos.Add(evento);
            await db.SaveChangesAsync(ct);

            string[] roles = ["Cliente", "Proveedor", "Staff"];
            for (int i = 0; i < 14; i++)
            {
                db.ParticipantesEvento.Add(new ParticipanteEvento
                {
                    EventoId = evento.Id,
                    Nombre = i < clientes.Count ? clientes[i].Nombre : $"Participante {i + 1}",
                    Rol = roles[rnd.Next(roles.Length)],
                    Stand = $"{(char)('A' + rnd.Next(0, 6))}{rnd.Next(1, 20)}",
                    Asistio = rnd.Next(0, 3) > 0,
                });
            }
            await db.SaveChangesAsync(ct);
        }

        // --- Configuración del sistema ----------------------
        if (!await db.Configuraciones.AnyAsync(ct))
        {
            db.Configuraciones.AddRange(
                new Configuracion { Clave = "empresa.nombre", Valor = "Compipro S.A.C.", Descripcion = "Razón social" },
                new Configuracion { Clave = "empresa.moneda", Valor = "PEN", Descripcion = "Moneda por defecto" },
                new Configuracion { Clave = "empresa.igv", Valor = "18", Descripcion = "% de IGV" },
                new Configuracion { Clave = "inventario.alertaStock", Valor = "true", Descripcion = "Alertas de bajo stock" },
                new Configuracion { Clave = "reportes.emailDiario", Valor = "false", Descripcion = "Enviar reporte diario por email" });
            await db.SaveChangesAsync(ct);
        }

        // --- Cotizaciones y pedidos (flujo comercial de la agencia) ---------
        if (!await db.Cotizaciones.AnyAsync(ct))
        {
            var productos = await db.Productos.ToListAsync(ct);
            var vendedores = await db.Users.ToListAsync(ct);
            string[] tecnicas = ["Serigrafía", "Bordado", "Tampografía", "Grabado láser", "DTF", "Full color", "Sublimación"];
            string[] estados = ["Borrador", "Enviada", "Enviada", "Aprobada", "Aprobada", "Rechazada"];
            int year = DateTime.UtcNow.Year;
            int correlativoCot = 0, correlativoPed = 0;

            for (int i = 0; i < 40 && productos.Count > 0; i++)
            {
                var cli = clientes[rnd.Next(clientes.Count)];
                var fecha = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-rnd.Next(0, 300)));
                var estado = estados[rnd.Next(estados.Length)];

                var items = new List<CotizacionItem>();
                int nLineas = rnd.Next(1, 4);
                for (int k = 0; k < nLineas; k++)
                {
                    var prod = productos[rnd.Next(productos.Count)];
                    int cant = new[] { 50, 100, 150, 250, 500, 1000 }[rnd.Next(6)];
                    decimal pu = Math.Round(prod.Precio * (decimal)(0.9 + rnd.NextDouble() * 0.6), 2);
                    items.Add(new CotizacionItem
                    {
                        ProductoId = prod.Id,
                        Descripcion = $"{prod.Nombre} — personalización con logo",
                        Tecnica = tecnicas[rnd.Next(tecnicas.Length)],
                        Cantidad = cant,
                        PrecioUnitario = pu,
                        Subtotal = Math.Round(cant * pu, 2),
                    });
                }
                decimal subtotal = Math.Round(items.Sum(x => x.Subtotal), 2);
                decimal igv = Math.Round(subtotal * 0.18m, 2);

                var cot = new Cotizacion
                {
                    Codigo = $"COT-{year}-{++correlativoCot:D4}",
                    ClienteId = cli.Id,
                    VendedorId = vendedores.Count > 0 ? vendedores[rnd.Next(vendedores.Count)].Id : null,
                    Estado = estado,
                    Fecha = fecha,
                    ValidaHasta = fecha.AddDays(15),
                    Notas = "Incluye una muestra física sin costo. Adelanto 50%.",
                    Subtotal = subtotal,
                    Igv = igv,
                    Total = subtotal + igv,
                    Items = items,
                };
                db.Cotizaciones.Add(cot);
                await db.SaveChangesAsync(ct);

                if (estado == "Aprobada")
                {
                    var fechaPed = fecha.AddDays(2);
                    var compromiso = fechaPed.AddDays(rnd.Next(7, 25));
                    string[] prodEstados = ["Pendiente", "EnProduccion", "ControlCalidad", "Listo", "Entregado"];
                    var pe = prodEstados[rnd.Next(prodEstados.Length)];
                    decimal pagado = pe == "Entregado"
                        ? cot.Total
                        : Math.Round(cot.Total * (decimal)(rnd.Next(0, 2) == 0 ? 0.5 : 0.0), 2);

                    db.Pedidos.Add(new Pedido
                    {
                        Codigo = $"PED-{year}-{++correlativoPed:D4}",
                        CotizacionId = cot.Id,
                        ClienteId = cli.Id,
                        EstadoProduccion = pe,
                        Fecha = fechaPed,
                        FechaCompromiso = compromiso,
                        Total = cot.Total,
                        Pagado = pagado,
                        Notas = "Arte aprobado por el cliente.",
                    });
                    await db.SaveChangesAsync(ct);
                }
            }
        }

        // --- Solicitudes web (bandeja de entrada del sitio público) --------
        if (!await db.Solicitudes.AnyAsync(ct))
        {
            var ahora = DateTimeOffset.UtcNow;
            db.Solicitudes.AddRange(
                new Solicitud
                {
                    Tipo = "Cotizacion", Nombre = "María Fernández", Empresa = "Inversiones Delta SAC",
                    Email = "mfernandez@delta.pe", Telefono = "987654321",
                    Mensaje = "Necesito 500 tomatodos con logo grabado para la campaña de fin de año.",
                    ProductoNombre = "Tomatodo deportivo", Categoria = "Artículos Ecológicos",
                    Estado = "Nueva", Origen = "Web", CreatedAt = ahora.AddDays(-1),
                },
                new Solicitud
                {
                    Tipo = "Cotizacion", Nombre = "Jorge Ramírez", Empresa = "Clínica Santa Ana",
                    Email = "jramirez@santaana.pe", Telefono = "946570001",
                    Mensaje = "Cotización de 300 polos bordados con el logo para el personal médico.",
                    ProductoNombre = "Polo bordado", Categoria = "Textiles",
                    Estado = "Nueva", Origen = "Web", CreatedAt = ahora.AddDays(-2),
                },
                new Solicitud
                {
                    Tipo = "Contacto", Nombre = "Lucía Torres", Empresa = "Estudio Torres & Asociados",
                    Email = "lucia@torres.legal", Telefono = "999112233",
                    Mensaje = "Quisiera coordinar una reunión para conocer su catálogo corporativo.",
                    Direccion = "Av. Javier Prado Este 1234", Ciudad = "Lima", CodigoPostal = "15036",
                    Estado = "Nueva", Origen = "Web", CreatedAt = ahora.AddDays(-3),
                },
                new Solicitud
                {
                    Tipo = "Cotizacion", Nombre = "Pedro Salazar", Empresa = "Universidad del Norte",
                    Email = "psalazar@udelnorte.edu.pe",
                    Mensaje = "1000 lápices con semilla para la feria de sostenibilidad universitaria.",
                    ProductoNombre = "Lápiz con semilla", Categoria = "Artículos Ecológicos",
                    Estado = "Atendida", Origen = "Web",
                    AtendidaAt = ahora.AddDays(-4), CreatedAt = ahora.AddDays(-6),
                },
                new Solicitud
                {
                    Tipo = "Contacto", Nombre = "Ana Beltrán",
                    Email = "ana.beltran@gmail.com", Telefono = "944556677",
                    Mensaje = "¿Realizan envíos a provincia? Estoy en Arequipa.",
                    Ciudad = "Arequipa", Estado = "Atendida", Origen = "Web",
                    AtendidaAt = ahora.AddDays(-7), CreatedAt = ahora.AddDays(-8),
                },
                new Solicitud
                {
                    Tipo = "Cotizacion", Nombre = "Raúl Cárdenas", Empresa = "Banco Continental",
                    Email = "rcardenas@bancocont.pe", Telefono = "955667788",
                    Mensaje = "Kits de bienvenida para 250 nuevos colaboradores.",
                    Categoria = "Corporativo", Estado = "Descartada", Origen = "Web",
                    Notas = "Presupuesto fuera de rango para este trimestre; retomar en Q2.",
                    AtendidaAt = ahora.AddDays(-10), CreatedAt = ahora.AddDays(-12),
                });
            await db.SaveChangesAsync(ct);
        }
    }
}
