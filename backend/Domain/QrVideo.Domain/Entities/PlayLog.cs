namespace QrVideo.Domain.Entities;

public class PlayLog : BaseEntity
{
    public Guid VideoId { get; set; }
    public string? ClientInfo { get; set; }
    public TimeSpan? WatchedDuration { get; set; }
    public bool Completed { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Video? Video { get; set; }
}
