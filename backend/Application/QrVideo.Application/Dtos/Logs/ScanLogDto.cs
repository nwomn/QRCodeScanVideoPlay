namespace QrVideo.Application.Dtos.Logs;

public record ScanLogDto(
    Guid Id,
    Guid QrCodeId,
    string CodeValue,
    DateTime Timestamp,
    bool Success,
    string? FailReason,
    string? ClientInfo);
