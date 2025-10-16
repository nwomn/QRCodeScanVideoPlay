using Microsoft.AspNetCore.Http;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Videos;

namespace QrVideo.Application.Interfaces.Services;

public interface IVideoService
{
    Task<VideoDto> CreateAsync(CreateVideoRequest request, IFormFile file, CancellationToken cancellationToken = default);
    Task<VideoDto> UpdateAsync(Guid id, UpdateVideoRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VideoDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<VideoDto>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
}
