namespace QrVideo.Application.Dtos.Stats;

public record DashboardSummaryDto(int VideoCount, int QrCodeCount, long ScanCount, long PlayCount);
