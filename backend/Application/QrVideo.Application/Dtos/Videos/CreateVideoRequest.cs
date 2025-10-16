namespace QrVideo.Application.Dtos.Videos;

public record CreateVideoRequest(
    string Title,
    string? Description);
