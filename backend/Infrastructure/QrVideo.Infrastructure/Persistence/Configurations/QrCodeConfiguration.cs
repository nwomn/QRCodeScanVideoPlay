using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence.Configurations;

public class QrCodeConfiguration : IEntityTypeConfiguration<QrCode>
{
    public void Configure(EntityTypeBuilder<QrCode> builder)
    {
        builder.ToTable("qr_codes");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CodeValue).IsUnique();
        builder.Property(x => x.CodeValue).IsRequired().HasMaxLength(128);
        builder.Property(x => x.Description).HasMaxLength(512);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.HasOne(x => x.Video)
            .WithMany(v => v.QrCodes)
            .HasForeignKey(x => x.VideoId);
    }
}
