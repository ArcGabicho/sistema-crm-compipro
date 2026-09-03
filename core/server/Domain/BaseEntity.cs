namespace Server.Domain;

/// <summary>Base de todas las entidades del CRM con Id y marcas de tiempo.</summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
