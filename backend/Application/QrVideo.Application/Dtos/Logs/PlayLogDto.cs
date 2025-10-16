namespace QrVideo.Application.Dtos.Logs;

public record PlayLogDto(
    Guid Id,
    Guid VideoId,
    string VideoTitle,
    DateTime Timestamp,
    TimeSpan? WatchedDuration,
    bool Completed,
    string? ClientInfo);
