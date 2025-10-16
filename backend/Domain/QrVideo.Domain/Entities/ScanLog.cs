namespace QrVideo.Domain.Entities;

public class ScanLog : BaseEntity
{
    public Guid QrCodeId { get; set; }
    public string? ClientInfo { get; set; }
    public bool Success { get; set; }
    public string? FailReason { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public QrCode? QrCode { get; set; }
}
