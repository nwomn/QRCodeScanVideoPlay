namespace QrVideo.Application.Interfaces.Services;

public interface IQrCodeGenerator
{
    Task<byte[]> GenerateAsync(string content, CancellationToken cancellationToken = default);
}
