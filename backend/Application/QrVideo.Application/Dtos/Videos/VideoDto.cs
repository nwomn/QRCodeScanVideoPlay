namespace QrVideo.Application.Dtos.Videos;

public record VideoDto(
    Guid Id,
    string Title,
    string? Description,
    string FilePath,
    string? CoverPath,
    TimeSpan? Duration,
    string? ContentType,
    long? FileSize,
    bool IsActive,
    DateTime CreatedAt);
