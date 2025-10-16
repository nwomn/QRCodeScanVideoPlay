using System;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QrVideo.Application.Dtos.QrCodes;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(IQrCodeService qrCodeService, ILogService logService) : ControllerBase
{
    private readonly IQrCodeService _qrCodeService = qrCodeService;
    private readonly ILogService _logService = logService;

    [HttpGet("resolve/{codeValue}")]
    [AllowAnonymous]
    public async Task<ActionResult<ScanResultDto>> Resolve(string codeValue, CancellationToken cancellationToken)
    {
        var clientInfo = GetClientInfo();
        var result = await _qrCodeService.ResolveByCodeAsync(codeValue, cancellationToken);
        if (result is null)
        {
            return NotFound();
        }

        await _logService.RecordScanAsync(result.QrCode.Id, true, null, clientInfo, cancellationToken);
        return Ok(result);
    }

    [HttpPost("videos/{videoId:guid}/plays")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordPlay(Guid videoId, [FromBody] PlayLogRequest request, CancellationToken cancellationToken)
    {
        var clientInfo = GetClientInfo();
        await _logService.RecordPlayAsync(videoId, request.WatchedDurationSeconds.HasValue ? TimeSpan.FromSeconds(request.WatchedDurationSeconds.Value) : null, request.Completed, clientInfo, cancellationToken);
        return Accepted();
    }

    private string GetClientInfo()
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"IP={ip}; UA={userAgent}";
    }

    public record PlayLogRequest(double? WatchedDurationSeconds, bool Completed);
}
