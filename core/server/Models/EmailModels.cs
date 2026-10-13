namespace Server.Models;

public sealed record EnviarPruebaInput(string? Para);

/// <summary>Envío de una cotización por email: <c>Para</c> vacío = email del cliente.</summary>
public sealed record EnviarCotizacionInput(string? Para, string? Mensaje);
