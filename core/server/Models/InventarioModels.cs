namespace Server.Models;

/// <summary>Payload para registrar un movimiento de inventario.</summary>
public sealed record MovimientoInput(
    int ProductoId,
    string Tipo,      // Entrada | Salida | Ajuste
    int Cantidad,
    string? Motivo);
