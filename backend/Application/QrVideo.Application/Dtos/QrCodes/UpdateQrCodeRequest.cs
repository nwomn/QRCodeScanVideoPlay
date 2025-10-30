namespace QrVideo.Application.Dtos.QrCodes;

public record UpdateQrCodeRequest(Guid? VideoId, bool IsActive, string? Description);
