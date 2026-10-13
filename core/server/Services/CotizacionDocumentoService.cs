using System.Globalization;
using System.Net;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Server.Data;
using Server.Domain;

namespace Server.Services;

public sealed record PdfCotizacion(byte[] Contenido, string Nombre);

public sealed record ResultadoEnvioCotizacion(string Para, bool Simulado, string Estado);

public interface ICotizacionDocumentoService
{
    Task<PdfCotizacion?> GenerarPdfAsync(int id, CancellationToken ct);

    /// <summary>Envía el PDF por email (al cliente o a <paramref name="para"/>) y marca la cotización como Enviada.</summary>
    Task<(ResultadoEnvioCotizacion? Resultado, string? Error)> EnviarPorEmailAsync(
        int id, string? para, string? mensaje, string? actor, CancellationToken ct);
}

/// <summary>PDF de la cotización (QuestPDF) y su envío por correo.</summary>
public sealed class CotizacionDocumentoService(
    AppDbContext db,
    ICotizacionService cotizaciones,
    IEmailSender email,
    IAuditService audit) : ICotizacionDocumentoService
{
    private const string Naranja = "#FFA62B";
    private const string Tinta = "#151515";
    private const string Gris = "#737373";
    private const string Linea = "#E5E5E5";

    public async Task<PdfCotizacion?> GenerarPdfAsync(int id, CancellationToken ct)
    {
        var cot = await cotizaciones.GetAsync(id, ct);
        if (cot is null) return null;

        var empresa = await EmpresaAsync(ct);
        return new PdfCotizacion(Documento(cot, empresa).GeneratePdf(), $"{cot.Codigo}.pdf");
    }

    public async Task<(ResultadoEnvioCotizacion? Resultado, string? Error)> EnviarPorEmailAsync(
        int id, string? para, string? mensaje, string? actor, CancellationToken ct)
    {
        var cot = await cotizaciones.GetAsync(id, ct);
        if (cot is null) return (null, null);

        string? destino = string.IsNullOrWhiteSpace(para) ? cot.Cliente?.Email : para.Trim();
        if (!EmailSender.EsEmailValido(destino))
            return (null, "El cliente no tiene un email válido; escribe uno para enviar la cotización.");

        var empresa = await EmpresaAsync(ct);
        byte[] pdf = Documento(cot, empresa).GeneratePdf();
        string saludo = cot.Cliente?.Contacto is { Length: > 0 } contacto ? contacto : cot.Cliente?.Nombre ?? "cliente";

        string cuerpo = $"""
            <p>Hola {WebUtility.HtmlEncode(saludo)},</p>
            <p>Te enviamos la cotización <strong>{cot.Codigo}</strong> por un total de
            <strong>{Soles(cot.Total)}</strong>{(cot.ValidaHasta is { } v ? $", válida hasta el {v:dd/MM/yyyy}" : "")}.
            Encontrarás el detalle en el PDF adjunto.</p>
            {(string.IsNullOrWhiteSpace(mensaje) ? "" : $"<p>{EmailLayout.TextoAHtml(mensaje)}</p>")}
            <p>Quedamos atentos a tus comentarios.<br>{WebUtility.HtmlEncode(empresa.Nombre)}</p>
            """;

        var resultado = await email.EnviarAsync(new MensajeEmail(destino!, $"Cotización {cot.Codigo} · {empresa.Nombre}",
            EmailLayout.Envolver(cuerpo), saludo)
        {
            Adjuntos = [new AdjuntoEmail($"{cot.Codigo}.pdf", pdf, "application/pdf")],
        }, ct);
        if (!resultado.Ok) return (null, resultado.Error ?? "No se pudo enviar el correo.");

        string estado = cot.Estado;
        if (cot.Estado == "Borrador")
        {
            var (actualizada, _) = await cotizaciones.CambiarEstadoAsync(id, "Enviada", actor, ct);
            estado = actualizada?.Estado ?? estado;
        }

        await audit.LogAsync(actor, "EnviarEmail", nameof(Cotizacion), id, $"{destino}: {resultado.Estado}", ct);
        return (new ResultadoEnvioCotizacion(destino!, resultado.Estado == EstadosEmail.Simulado, estado), null);
    }

    private sealed record Empresa(string Nombre, string? Ruc, string? Direccion, string? Telefono, string? Email, string? Web);

    /// <summary>Datos del membrete desde Configuración (claves empresa.*), con valores por defecto.</summary>
    private async Task<Empresa> EmpresaAsync(CancellationToken ct)
    {
        var claves = await db.Configuraciones.AsNoTracking()
            .Where(c => c.Clave.StartsWith("empresa."))
            .ToDictionaryAsync(c => c.Clave, c => c.Valor, ct);
        string? Valor(string clave, string? porDefecto)
            => claves.TryGetValue(clave, out var v) && !string.IsNullOrWhiteSpace(v) ? v : porDefecto;

        return new Empresa(
            Valor("empresa.nombre", "Compipro S.A.C.")!,
            Valor("empresa.ruc", null),
            Valor("empresa.direccion", "Av. Las Flores de Primavera 184, San Juan de Lurigancho, Lima"),
            Valor("empresa.telefono", "+51 932 230 880"),
            Valor("empresa.email", "ventas@compipro.net"),
            Valor("empresa.web", "compipro.net"));
    }

    private static string Soles(decimal monto) => "S/ " + monto.ToString("#,##0.00", CultureInfo.InvariantCulture);

    private static string Fecha(DateOnly? fecha) => fecha?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";

    private static Document Documento(Cotizacion c, Empresa e) => Document.Create(doc => doc.Page(page =>
    {
        page.Size(PageSizes.A4);
        page.Margin(36);
        page.DefaultTextStyle(x => x.FontSize(9.5f).FontColor("#262626"));

        page.Header().Element(h => Encabezado(h, c, e));
        page.Content().PaddingVertical(18).Element(x => Contenido(x, c));
        page.Footer().Row(row =>
        {
            row.RelativeItem().Text($"{e.Nombre} · {e.Web}").FontSize(8).FontColor(Gris);
            row.AutoItem().Text(t =>
            {
                t.DefaultTextStyle(s => s.FontSize(8).FontColor(Gris));
                t.Span("Página ");
                t.CurrentPageNumber();
                t.Span(" de ");
                t.TotalPages();
            });
        });
    })).WithMetadata(new DocumentMetadata { Title = $"Cotización {c.Codigo}", Author = e.Nombre });

    private static void Encabezado(IContainer contenedor, Cotizacion c, Empresa e)
    {
        contenedor.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(t =>
                {
                    t.DefaultTextStyle(s => s.FontSize(26).Bold().FontColor(Tinta));
                    t.Span("c");
                    t.Span("o").FontColor(Naranja);
                    t.Span("mpi");
                    t.Span("pro").FontColor(Naranja);
                });
                col.Item().PaddingTop(4).Text(e.Nombre).Bold();
                if (e.Ruc is not null) col.Item().Text($"RUC {e.Ruc}").FontColor(Gris);
                if (e.Direccion is not null) col.Item().Text(e.Direccion).FontColor(Gris);
                col.Item().Text(string.Join("  ·  ", new[] { e.Telefono, e.Email }.Where(v => v is not null))).FontColor(Gris);
            });

            row.ConstantItem(190).Background(Tinta).Padding(14).Column(col =>
            {
                col.Item().Text("COTIZACIÓN").FontSize(9).Bold().FontColor(Naranja).LetterSpacing(0.1f);
                col.Item().Text(c.Codigo).FontSize(16).Bold().FontColor(Colors.White);
                col.Item().PaddingTop(6).Text($"Fecha: {Fecha(c.Fecha)}").FontColor(Colors.Grey.Lighten2);
                col.Item().Text($"Válida hasta: {Fecha(c.ValidaHasta)}").FontColor(Colors.Grey.Lighten2);
                col.Item().Text($"Estado: {c.Estado}").FontColor(Colors.Grey.Lighten2);
            });
        });
    }

    private static void Contenido(IContainer contenedor, Cotizacion c)
    {
        var cliente = c.Cliente;
        contenedor.Column(col =>
        {
            col.Spacing(16);

            col.Item().Background("#F7F7F5").CornerRadius(10).Padding(12).Row(row =>
            {
                row.RelativeItem().Column(datos =>
                {
                    datos.Item().Text("CLIENTE").FontSize(8).Bold().FontColor(Gris);
                    datos.Item().Text(cliente?.RazonSocial ?? cliente?.Nombre ?? "—").FontSize(11).Bold();
                    if (cliente?.Ruc is { } ruc) datos.Item().Text($"RUC {ruc}");
                    if (cliente?.Direccion is { } dir) datos.Item().Text(dir).FontColor(Gris);
                });
                row.RelativeItem().Column(datos =>
                {
                    datos.Item().Text("CONTACTO").FontSize(8).Bold().FontColor(Gris);
                    datos.Item().Text(cliente?.Contacto ?? "—");
                    if (cliente?.Email is { } mail) datos.Item().Text(mail).FontColor(Gris);
                    if (cliente?.Telefono is { } tel) datos.Item().Text(tel).FontColor(Gris);
                    if (c.Vendedor?.Name is { } vendedor) datos.Item().PaddingTop(4).Text($"Asesor: {vendedor}");
                });
            });

            col.Item().Table(tabla =>
            {
                tabla.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(24);
                    cols.RelativeColumn(5);
                    cols.ConstantColumn(50);
                    cols.ConstantColumn(70);
                    cols.ConstantColumn(80);
                });

                tabla.Header(h =>
                {
                    static IContainer Celda(IContainer x) => x.Background(Tinta).PaddingVertical(6).PaddingHorizontal(6);
                    h.Cell().Element(Celda).Text("#").FontColor(Colors.White).Bold();
                    h.Cell().Element(Celda).Text("Descripción").FontColor(Colors.White).Bold();
                    h.Cell().Element(Celda).AlignRight().Text("Cant.").FontColor(Colors.White).Bold();
                    h.Cell().Element(Celda).AlignRight().Text("P. unit.").FontColor(Colors.White).Bold();
                    h.Cell().Element(Celda).AlignRight().Text("Subtotal").FontColor(Colors.White).Bold();
                });

                int n = 1;
                foreach (var item in c.Items.OrderBy(i => i.Id))
                {
                    static IContainer Celda(IContainer x) => x.BorderBottom(1).BorderColor(Linea).PaddingVertical(6).PaddingHorizontal(6);
                    tabla.Cell().Element(Celda).Text($"{n++}").FontColor(Gris);
                    tabla.Cell().Element(Celda).Column(d =>
                    {
                        d.Item().Text(item.Descripcion).Bold();
                        if (!string.IsNullOrWhiteSpace(item.Tecnica)) d.Item().Text($"Técnica: {item.Tecnica}").FontSize(8.5f).FontColor(Gris);
                    });
                    tabla.Cell().Element(Celda).AlignRight().Text($"{item.Cantidad:N0}");
                    tabla.Cell().Element(Celda).AlignRight().Text(Soles(item.PrecioUnitario));
                    tabla.Cell().Element(Celda).AlignRight().Text(Soles(item.Subtotal));
                }
            });

            col.Item().AlignRight().Width(220).Column(totales =>
            {
                void Fila(string etiqueta, string valor, bool destacado = false) => totales.Item()
                    .PaddingVertical(3).Row(r =>
                    {
                        var izq = r.RelativeItem().Text(etiqueta);
                        var der = r.AutoItem().Text(valor);
                        if (destacado)
                        {
                            izq.Bold().FontSize(12);
                            der.Bold().FontSize(12).FontColor(Naranja);
                        }
                    });
                Fila("Subtotal", Soles(c.Subtotal));
                Fila("IGV (18%)", Soles(c.Igv));
                totales.Item().LineHorizontal(1).LineColor(Linea);
                Fila("Total", Soles(c.Total), destacado: true);
            });

            if (!string.IsNullOrWhiteSpace(c.Notas))
            {
                col.Item().Column(notas =>
                {
                    notas.Item().Text("NOTAS").FontSize(8).Bold().FontColor(Gris);
                    notas.Item().Text(c.Notas);
                });
            }

            col.Item().Column(cond =>
            {
                cond.Item().Text("CONDICIONES").FontSize(8).Bold().FontColor(Gris);
                cond.Item().Text("• Precios en soles (PEN). Forma de pago: 50% de adelanto y saldo contra entrega.");
                cond.Item().Text("• El plazo de producción se confirma con la aprobación de artes y el adelanto.");
                cond.Item().Text($"• Cotización válida hasta el {Fecha(c.ValidaHasta)}.");
            });
        });
    }
}
