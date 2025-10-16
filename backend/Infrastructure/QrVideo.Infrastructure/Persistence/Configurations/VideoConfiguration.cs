using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence.Configurations;

public class VideoConfiguration : IEntityTypeConfiguration<Video>
{
    public void Configure(EntityTypeBuilder<Video> builder)
    {
        builder.ToTable("videos");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1024);
        builder.Property(x => x.FilePath).IsRequired().HasMaxLength(512);
        builder.Property(x => x.CoverPath).HasMaxLength(512);
        builder.Property(x => x.ContentType).HasMaxLength(128);
        builder.Property(x => x.FileSize);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
