using System;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using QrVideo.Application.Common;
using QrVideo.Application.Interfaces.Storage;

namespace QrVideo.Infrastructure.Storage;

public class LocalStorageService(IOptions<StorageSettings> options) : IStorageService
{
    private readonly StorageSettings _settings = options.Value;
    private readonly string _rootPath = Path.IsPathRooted(options.Value.BasePath)
        ? options.Value.BasePath
        : Path.Combine(AppContext.BaseDirectory, options.Value.BasePath);

    public async Task<string> SaveFileAsync(IFormFile file, string subDirectory, CancellationToken cancellationToken = default)
    {
        var safeFileName = GenerateSafeFileName(file.FileName);
        var relativePath = Path.Combine(subDirectory, safeFileName)
            .Replace("\\", "/");
        Directory.CreateDirectory(_rootPath);
        var absolutePath = Path.Combine(_rootPath, relativePath);
        var directory = Path.GetDirectoryName(absolutePath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await using var stream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream, cancellationToken);

        return relativePath.Replace("\\", "/");
    }

    public Task DeleteFileAsync(string path, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return Task.CompletedTask;
        }

        var absolutePath = Path.Combine(_rootPath, path);
        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }

        return Task.CompletedTask;
    }

    public string GetPublicUrl(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return string.Empty;
        }

        if (string.IsNullOrWhiteSpace(_settings.PublicBaseUrl))
        {
            return "/" + path.TrimStart('/');
        }

        return string.Join('/', _settings.PublicBaseUrl.TrimEnd('/'), path.TrimStart('/'));
    }

    private static string GenerateSafeFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        var safeName = Path.GetFileNameWithoutExtension(fileName)
            .Replace(" ", "-")
            .Replace("/", string.Empty)
            .Replace("\\", string.Empty);
        return $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
    }
}
