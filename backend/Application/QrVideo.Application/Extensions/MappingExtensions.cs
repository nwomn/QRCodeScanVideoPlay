using System;
using QrVideo.Application.Dtos.Logs;
using QrVideo.Application.Dtos.QrCodes;
using QrVideo.Application.Dtos.Videos;
using QrVideo.Domain.Entities;

namespace QrVideo.Application.Extensions;

public static class MappingExtensions
{
    public static VideoDto ToDto(this Video entity, Func<string, string> urlResolver) => new(
        entity.Id,
        entity.Title,
        entity.Description,
        urlResolver(entity.FilePath),
        string.IsNullOrWhiteSpace(entity.CoverPath) ? null : urlResolver(entity.CoverPath!),
        entity.Duration,
        entity.ContentType,
        entity.FileSize,
        entity.IsActive,
        entity.CreatedAt);

    public static QrCodeDto ToDto(this QrCode entity) => new(
        entity.Id,
        entity.CodeValue,
        entity.VideoId,
        entity.Video?.Title ?? string.Empty,
        entity.IsActive,
        entity.CreatedAt,
        entity.Description);

    public static ScanLogDto ToDto(this ScanLog entity) => new(
        entity.Id,
        entity.QrCodeId,
        entity.QrCode?.CodeValue ?? string.Empty,
        entity.Timestamp,
        entity.Success,
        entity.FailReason,
        entity.ClientInfo);

    public static PlayLogDto ToDto(this PlayLog entity) => new(
        entity.Id,
        entity.VideoId,
        entity.Video?.Title ?? string.Empty,
        entity.Timestamp,
        entity.WatchedDuration,
        entity.Completed,
        entity.ClientInfo);
}
