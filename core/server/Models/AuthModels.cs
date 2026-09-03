namespace Server.Models;

public sealed record LoginRequest(string? Email, string? Password);

public sealed record LoginResponse(
    string Token,
    string Email,
    string Name,
    string Role,
    DateTimeOffset ExpiresAt);

public sealed record CurrentUserResponse(string? Email, string? Name, string? Role);
