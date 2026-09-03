namespace Server.Config;

/// <summary>Firma y vigencia del JWT (sección <c>Jwt</c> de appsettings).</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "compipro-crm";
    public string Audience { get; set; } = "compipro-crm-client";
    public string Key { get; set; } = string.Empty;
    public int ExpiresMinutes { get; set; } = 120;
}
