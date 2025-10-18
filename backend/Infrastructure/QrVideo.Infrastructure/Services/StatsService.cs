using Microsoft.EntityFrameworkCore;
using QrVideo.Application.Dtos.Stats;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class StatsService(AppDbContext dbContext) : IStatsService
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var videoCount = await _dbContext.Videos.CountAsync(cancellationToken);
        var qrCodeCount = await _dbContext.QrCodes.CountAsync(cancellationToken);
        var scanCount = await _dbContext.ScanLogs.LongCountAsync(cancellationToken);
        var playCount = await _dbContext.PlayLogs.LongCountAsync(cancellationToken);

        return new DashboardSummaryDto(videoCount, qrCodeCount, scanCount, playCount);
    }
}
