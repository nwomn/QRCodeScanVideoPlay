namespace QrVideo.Domain.Entities;

public class AdminUser : BaseEntity
{
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
}
