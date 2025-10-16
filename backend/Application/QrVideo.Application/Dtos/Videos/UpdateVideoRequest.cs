namespace QrVideo.Application.Dtos.Videos;

public record UpdateVideoRequest(
    string Title,
    string? Description,
    bool IsActive);
