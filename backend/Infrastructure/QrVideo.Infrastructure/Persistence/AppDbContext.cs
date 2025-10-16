using Microsoft.EntityFrameworkCore;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<QrCode> QrCodes => Set<QrCode>();
    public DbSet<ScanLog> ScanLogs => Set<ScanLog>();
    public DbSet<PlayLog> PlayLogs => Set<PlayLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
