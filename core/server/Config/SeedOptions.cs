namespace Server.Config;

/// <summary>Usuario administrador que se siembra la primera vez (sección <c>Seed</c>).</summary>
public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public SeedAdmin Admin { get; set; } = new();
}

public sealed class SeedAdmin
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = "Administrador";
    public string Password { get; set; } = string.Empty;
}
