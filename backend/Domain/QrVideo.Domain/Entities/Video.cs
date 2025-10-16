namespace QrVideo.Domain.Entities;

public class Video : BaseEntity
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string FilePath { get; set; }
    public string? CoverPath { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<QrCode> QrCodes { get; set; } = new List<QrCode>();
    public ICollection<PlayLog> PlayLogs { get; set; } = new List<PlayLog>();
}
