namespace QrVideo.Domain.Entities;

public class QrCode : BaseEntity
{
    public required string CodeValue { get; set; }
    public Guid VideoId { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public Video? Video { get; set; }
    public ICollection<ScanLog> ScanLogs { get; set; } = new List<ScanLog>();
}
