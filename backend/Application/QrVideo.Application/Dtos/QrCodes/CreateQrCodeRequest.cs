namespace QrVideo.Application.Dtos.QrCodes;

public record CreateQrCodeRequest(Guid VideoId, string? Description, bool IsActive);
