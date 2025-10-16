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
        var videoCountTask = _dbContext.Videos.CountAsync(cancellationToken);
        var qrCodeCountTask = _dbContext.QrCodes.CountAsync(cancellationToken);
        var scanCountTask = _dbContext.ScanLogs.LongCountAsync(cancellationToken);
        var playCountTask = _dbContext.PlayLogs.LongCountAsync(cancellationToken);

        await Task.WhenAll(videoCountTask, qrCodeCountTask, scanCountTask, playCountTask);

        return new DashboardSummaryDto(videoCountTask.Result, qrCodeCountTask.Result, scanCountTask.Result, playCountTask.Result);
    }
}
