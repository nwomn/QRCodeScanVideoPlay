using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Logs;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LogsController(ILogService logService) : ControllerBase
{
    private readonly ILogService _logService = logService;

    [HttpGet("scans")]
    public async Task<ActionResult<PagedResult<ScanLogDto>>> GetScanLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] Guid? qrCodeId = null, CancellationToken cancellationToken = default)
    {
        var logs = await _logService.GetScanLogsAsync(page, pageSize, qrCodeId, cancellationToken);
        return Ok(logs);
    }

    [HttpGet("plays")]
    public async Task<ActionResult<PagedResult<PlayLogDto>>> GetPlayLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] Guid? videoId = null, CancellationToken cancellationToken = default)
    {
        var logs = await _logService.GetPlayLogsAsync(page, pageSize, videoId, cancellationToken);
        return Ok(logs);
    }
}
