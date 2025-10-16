using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence.Configurations;

public class PlayLogConfiguration : IEntityTypeConfiguration<PlayLog>
{
    public void Configure(EntityTypeBuilder<PlayLog> builder)
    {
        builder.ToTable("play_logs");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.VideoId);
        builder.Property(x => x.ClientInfo).HasMaxLength(512);
        builder.Property(x => x.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.HasOne(x => x.Video)
            .WithMany(v => v.PlayLogs)
            .HasForeignKey(x => x.VideoId);
    }
}
