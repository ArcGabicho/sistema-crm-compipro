namespace Server.Data;

/// <summary>Fila de <see cref="ClientSeedData"/>: un contacto de empresa tal como viene en el export.</summary>
public sealed class ClientSeedRow
{
    public string? CompanyName { get; init; }
    public string? LegalName { get; init; }
    public string? Industry { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? JobTitle { get; init; }
    public string? TaxId { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public string? Website { get; init; }
    public string? Address { get; init; }
    public string? District { get; init; }
    public string? Province { get; init; }
    public DateTime CreatedAt { get; init; }
}
