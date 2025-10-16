using QRCoder;
using QrVideo.Application.Interfaces.Services;

namespace QrVideo.Infrastructure.QrGeneration;

public class QrCodeGenerator : IQrCodeGenerator
{
    public Task<byte[]> GenerateAsync(string content, CancellationToken cancellationToken = default)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var pngQrCode = new PngByteQRCode(data);
        var bytes = pngQrCode.GetGraphic(20);
        return Task.FromResult(bytes);
    }
}
