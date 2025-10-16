using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Videos;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VideosController(IVideoService videoService) : ControllerBase
{
    private readonly IVideoService _videoService = videoService;

    [HttpGet]
    public async Task<ActionResult<PagedResult<VideoDto>>> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, CancellationToken cancellationToken = default)
    {
        var result = await _videoService.GetPagedAsync(page, pageSize, search, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VideoDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var video = await _videoService.GetByIdAsync(id, cancellationToken);
        if (video is null)
        {
            return NotFound();
        }

        return Ok(video);
    }

    [HttpPost]
    [RequestSizeLimit(536_870_912)] // 512 MB limit for safety
    public async Task<ActionResult<VideoDto>> Create([FromForm] CreateVideoForm form, CancellationToken cancellationToken)
    {
        if (form.File is null)
        {
            return BadRequest("Video file is required");
        }

        var request = new CreateVideoRequest(form.Title, form.Description);
        var video = await _videoService.CreateAsync(request, form.File, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = video.Id }, video);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VideoDto>> Update(Guid id, [FromBody] UpdateVideoRequest request, CancellationToken cancellationToken)
    {
        var video = await _videoService.UpdateAsync(id, request, cancellationToken);
        return Ok(video);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _videoService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    public record CreateVideoForm(string Title, string? Description, IFormFile? File);
}
