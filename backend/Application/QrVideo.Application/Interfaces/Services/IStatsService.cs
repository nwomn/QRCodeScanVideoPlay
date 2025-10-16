using QrVideo.Application.Dtos.Stats;

namespace QrVideo.Application.Interfaces.Services;

public interface IStatsService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);
}
