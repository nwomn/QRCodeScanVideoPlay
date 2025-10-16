using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QrVideo.Application.Dtos.Stats;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatsController(IStatsService statsService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await statsService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(summary);
    }
}
