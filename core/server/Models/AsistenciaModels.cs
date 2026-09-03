namespace Server.Models;

/// <summary>Resultado de un check-in de asistencia (lo consume el cliente para notificar por Sileo).</summary>
public sealed record CheckInResult(
    int RegistroId,
    DateOnly Fecha,
    TimeOnly HoraProgramada,
    TimeOnly HoraIngreso,
    int MinutosTardanza,
    int MinutosAnticipacion,
    bool Tarde,
    string Estado,
    bool YaRegistrada,
    bool Justificada);

public sealed record JustificacionInput(string? Texto);
