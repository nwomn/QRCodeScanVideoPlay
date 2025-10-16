using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Logs;

namespace QrVideo.Application.Interfaces.Services;

public interface ILogService
{
    Task<PagedResult<ScanLogDto>> GetScanLogsAsync(int page, int pageSize, Guid? qrCodeId, CancellationToken cancellationToken = default);
    Task<PagedResult<PlayLogDto>> GetPlayLogsAsync(int page, int pageSize, Guid? videoId, CancellationToken cancellationToken = default);
    Task RecordScanAsync(Guid qrCodeId, bool success, string? failReason, string? clientInfo, CancellationToken cancellationToken = default);
    Task RecordPlayAsync(Guid videoId, TimeSpan? watchedDuration, bool completed, string? clientInfo, CancellationToken cancellationToken = default);
}
