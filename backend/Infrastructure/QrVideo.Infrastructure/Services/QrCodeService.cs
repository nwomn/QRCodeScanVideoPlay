using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.QrCodes;
using QrVideo.Application.Extensions;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Application.Interfaces.Storage;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class QrCodeService(
    AppDbContext dbContext,
    IQrCodeGenerator qrCodeGenerator,
    IStorageService storageService,
    IOptions<StorageSettings> storageOptions,
    ILogger<QrCodeService> logger
) : IQrCodeService
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly IQrCodeGenerator _qrCodeGenerator = qrCodeGenerator;
    private readonly IStorageService _storageService = storageService;
    private readonly StorageSettings _storageSettings = storageOptions.Value;
    private readonly ILogger<QrCodeService> _logger = logger;

    public async Task<QrCodeDto> CreateAsync(CreateQrCodeRequest request, CancellationToken cancellationToken = default)
    {
        var video = await _dbContext.Videos.FirstOrDefaultAsync(x => x.Id == request.VideoId, cancellationToken)
                    ?? throw new KeyNotFoundException("Video not found");

        var codeValue = Guid.NewGuid().ToString("N");
        var qrCode = new Domain.Entities.QrCode
        {
            VideoId = video.Id,
            CodeValue = codeValue,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.QrCodes.Add(qrCode);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _dbContext.Entry(qrCode).Reference(x => x.Video).LoadAsync(cancellationToken);
        _logger.LogInformation("QR code {Id} created for video {VideoId}", qrCode.Id, video.Id);

        return qrCode.ToDto();
    }

    public async Task<QrCodeDto> UpdateAsync(Guid id, UpdateQrCodeRequest request, CancellationToken cancellationToken = default)
    {
        var qrCode = await _dbContext.QrCodes.Include(x => x.Video)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("QR code not found");

        // 如果需要更新视频绑定，先验证新视频是否存在
        if (request.VideoId.HasValue && request.VideoId.Value != qrCode.VideoId)
        {
            var videoExists = await _dbContext.Videos.AnyAsync(x => x.Id == request.VideoId.Value, cancellationToken);
            if (!videoExists)
            {
                throw new KeyNotFoundException("Video not found");
            }
            qrCode.VideoId = request.VideoId.Value;
        }

        qrCode.IsActive = request.IsActive;
        qrCode.Description = request.Description;
        qrCode.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _dbContext.Entry(qrCode).Reference(x => x.Video).LoadAsync(cancellationToken);
        _logger.LogInformation("QR code {Id} updated", qrCode.Id);

        return qrCode.ToDto();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var qrCode = await _dbContext.QrCodes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("QR code not found");

        _dbContext.QrCodes.Remove(qrCode);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("QR code {Id} deleted", id);
    }

    public async Task<QrCodeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.QrCodes.AsNoTracking()
            .Include(x => x.Video)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return entity?.ToDto();
    }

    public async Task<PagedResult<QrCodeDto>> GetPagedAsync(int page, int pageSize, Guid? videoId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.QrCodes.AsNoTracking().Include(x => x.Video).AsQueryable();
        if (videoId.HasValue)
        {
            query = query.Where(x => x.VideoId == videoId.Value);
        }

        var total = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(x => x.ToDto()).ToList();
        return new PagedResult<QrCodeDto>(dtos, page, pageSize, total);
    }

    public async Task<byte[]> GenerateImageAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var qrCode = await _dbContext.QrCodes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("QR code not found");

        // Generate QR code with full URL if BaseUrl is configured, otherwise use code value only
        var qrContent = string.IsNullOrWhiteSpace(_storageSettings.BaseUrl)
            ? qrCode.CodeValue
            : $"{_storageSettings.BaseUrl.TrimEnd('/')}/play/{qrCode.CodeValue}";

        _logger.LogInformation("Generating QR code image for ID {Id} with content: {Content}", id, qrContent);
        return await _qrCodeGenerator.GenerateAsync(qrContent, cancellationToken);
    }

    public async Task<ScanResultDto?> ResolveByCodeAsync(string codeValue, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(codeValue))
        {
            return null;
        }

        var normalized = codeValue.Trim();

        // Extract code from URL if the input is a full URL
        // Support formats like: https://mzfmedia.cn/play/abc123def456 or just abc123def456
        var codeMatch = Regex.Match(normalized, @"/play/([^/?#]+)", RegexOptions.IgnoreCase);
        if (codeMatch.Success)
        {
            normalized = codeMatch.Groups[1].Value;
            _logger.LogInformation("Extracted code '{Code}' from URL '{Url}'", normalized, codeValue);
        }

        var entity = await _dbContext.QrCodes
            .Include(x => x.Video)
            .FirstOrDefaultAsync(x => x.CodeValue == normalized, cancellationToken);

        if (entity is null || entity.IsActive is false || entity.Video is null || entity.Video.IsActive is false)
        {
            return null;
        }

        var qrDto = entity.ToDto();
        var videoDto = entity.Video.ToDto(_storageService.GetPublicUrl);
        return new ScanResultDto(qrDto, videoDto);
    }
}
