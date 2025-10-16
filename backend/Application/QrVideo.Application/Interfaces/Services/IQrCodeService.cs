using QrVideo.Application.Common;
using QrVideo.Application.Dtos.QrCodes;

namespace QrVideo.Application.Interfaces.Services;

public interface IQrCodeService
{
    Task<QrCodeDto> CreateAsync(CreateQrCodeRequest request, CancellationToken cancellationToken = default);
    Task<QrCodeDto> UpdateAsync(Guid id, UpdateQrCodeRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<QrCodeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<QrCodeDto>> GetPagedAsync(int page, int pageSize, Guid? videoId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateImageAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ScanResultDto?> ResolveByCodeAsync(string codeValue, CancellationToken cancellationToken = default);
}
