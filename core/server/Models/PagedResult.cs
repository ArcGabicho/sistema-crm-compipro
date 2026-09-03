namespace Server.Models;

/// <summary>Respuesta paginada estándar de los listados.</summary>
public sealed record PagedResult<T>(int Total, int Page, int PageSize, IReadOnlyList<T> Items);
