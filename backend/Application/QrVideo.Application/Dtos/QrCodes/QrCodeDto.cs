namespace QrVideo.Application.Dtos.QrCodes;

public record QrCodeDto(
    Guid Id,
    string CodeValue,
    Guid VideoId,
    string VideoTitle,
    bool IsActive,
    DateTime CreatedAt,
    string? Description);
