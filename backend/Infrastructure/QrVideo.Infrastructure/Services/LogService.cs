using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Logs;
using QrVideo.Application.Extensions;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Domain.Entities;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class LogService(
    AppDbContext dbContext,
    ILogger<LogService> logger
) : ILogService
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly ILogger<LogService> _logger = logger;

    public async Task<PagedResult<ScanLogDto>> GetScanLogsAsync(int page, int pageSize, Guid? qrCodeId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ScanLogs.AsNoTracking().Include(x => x.QrCode).AsQueryable();
        if (qrCodeId.HasValue)
        {
            query = query.Where(x => x.QrCodeId == qrCodeId.Value);
        }

        var total = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(x => x.ToDto()).ToList();
        return new PagedResult<ScanLogDto>(dtos, page, pageSize, total);
    }

    public async Task<PagedResult<PlayLogDto>> GetPlayLogsAsync(int page, int pageSize, Guid? videoId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.PlayLogs.AsNoTracking().Include(x => x.Video).AsQueryable();
        if (videoId.HasValue)
        {
            query = query.Where(x => x.VideoId == videoId.Value);
        }

        var total = await query.LongCountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(x => x.ToDto()).ToList();
        return new PagedResult<PlayLogDto>(dtos, page, pageSize, total);
    }

    public async Task RecordScanAsync(Guid qrCodeId, bool success, string? failReason, string? clientInfo, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.QrCodes.AsNoTracking().AnyAsync(x => x.Id == qrCodeId, cancellationToken);
        if (!exists)
        {
            _logger.LogWarning("Skip scan log because QR code {QrId} not found", qrCodeId);
            return;
        }

        var log = new ScanLog
        {
            QrCodeId = qrCodeId,
            Success = success,
            FailReason = failReason,
            ClientInfo = clientInfo,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.ScanLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Scan log recorded for QR {QrId} (success={Success})", qrCodeId, success);
    }

    public async Task RecordPlayAsync(Guid videoId, TimeSpan? watchedDuration, bool completed, string? clientInfo, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.Videos.AsNoTracking().AnyAsync(x => x.Id == videoId, cancellationToken);
        if (!exists)
        {
            _logger.LogWarning("Skip play log because video {VideoId} not found", videoId);
            return;
        }

        var log = new PlayLog
        {
            VideoId = videoId,
            WatchedDuration = watchedDuration,
            Completed = completed,
            ClientInfo = clientInfo,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.PlayLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Play log recorded for video {VideoId} (completed={Completed})", videoId, completed);
    }
}
