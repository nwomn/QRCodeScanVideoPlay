using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Videos;
using QrVideo.Application.Extensions;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Application.Interfaces.Storage;
using QrVideo.Domain.Entities;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class VideoService(
    AppDbContext dbContext,
    IStorageService storageService,
    ILogger<VideoService> logger
) : IVideoService
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly IStorageService _storageService = storageService;
    private readonly ILogger<VideoService> _logger = logger;

    public async Task<VideoDto> CreateAsync(CreateVideoRequest request, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken cancellationToken = default)
    {
        var relativePath = await _storageService.SaveFileAsync(file, "videos", cancellationToken);
        var video = new Video
        {
            Title = request.Title,
            Description = request.Description,
            FilePath = relativePath,
            ContentType = file.ContentType,
            FileSize = file.Length,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Videos.Add(video);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Video {Title} created with id {Id}", request.Title, video.Id);

        return video.ToDto(_storageService.GetPublicUrl);
    }

    public async Task<VideoDto> UpdateAsync(Guid id, UpdateVideoRequest request, CancellationToken cancellationToken = default)
    {
        var video = await _dbContext.Videos.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
                    ?? throw new KeyNotFoundException("Video not found");

        video.Title = request.Title;
        video.Description = request.Description;
        video.IsActive = request.IsActive;
        video.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Video {Id} updated", id);

        return video.ToDto(_storageService.GetPublicUrl);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var video = await _dbContext.Videos.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
                    ?? throw new KeyNotFoundException("Video not found");

        // 先删除物理文件
        try
        {
            await _storageService.DeleteFileAsync(video.FilePath, cancellationToken);
            if (!string.IsNullOrWhiteSpace(video.CoverPath))
            {
                await _storageService.DeleteFileAsync(video.CoverPath, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete file for video {Id}, continuing with database deletion", id);
        }

        // 再删除数据库记录
        _dbContext.Videos.Remove(video);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Video {Id} deleted", id);
    }

    public async Task<VideoDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var video = await _dbContext.Videos.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return video?.ToDto(_storageService.GetPublicUrl);
    }

    public async Task<PagedResult<VideoDto>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Videos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => EF.Functions.ILike(x.Title, $"%{search}%"));
        }

        var total = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtoItems = items.Select(x => x.ToDto(_storageService.GetPublicUrl)).ToList();
        return new PagedResult<VideoDto>(dtoItems, page, pageSize, total);
    }
}
