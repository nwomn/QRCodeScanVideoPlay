using QrVideo.Application.Dtos.Videos;

namespace QrVideo.Application.Dtos.QrCodes;

public record ScanResultDto(QrCodeDto QrCode, VideoDto Video);
