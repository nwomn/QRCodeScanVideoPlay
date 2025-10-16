using Microsoft.AspNetCore.Http;

namespace QrVideo.Application.Interfaces.Storage;

public interface IStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subDirectory, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string path, CancellationToken cancellationToken = default);
    string GetPublicUrl(string path);
}
