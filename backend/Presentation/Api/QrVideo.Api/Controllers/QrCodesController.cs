using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.QrCodes;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QrCodesController(IQrCodeService qrCodeService) : ControllerBase
{
    private readonly IQrCodeService _qrCodeService = qrCodeService;

    [HttpGet]
    public async Task<ActionResult<PagedResult<QrCodeDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] Guid? videoId = null, CancellationToken cancellationToken = default)
    {
        var list = await _qrCodeService.GetPagedAsync(page, pageSize, videoId, cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QrCodeDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var qrCode = await _qrCodeService.GetByIdAsync(id, cancellationToken);
        if (qrCode is null)
        {
            return NotFound();
        }

        return Ok(qrCode);
    }

    [HttpPost]
    public async Task<ActionResult<QrCodeDto>> Create([FromBody] CreateQrCodeRequest request, CancellationToken cancellationToken)
    {
        var qrCode = await _qrCodeService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = qrCode.Id }, qrCode);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<QrCodeDto>> Update(Guid id, [FromBody] UpdateQrCodeRequest request, CancellationToken cancellationToken)
    {
        var qrCode = await _qrCodeService.UpdateAsync(id, request, cancellationToken);
        return Ok(qrCode);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _qrCodeService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/image")]
    [AllowAnonymous]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var bytes = await _qrCodeService.GenerateImageAsync(id, cancellationToken);
        return File(bytes, "image/png", $"qrcode-{id}.png");
    }
}
