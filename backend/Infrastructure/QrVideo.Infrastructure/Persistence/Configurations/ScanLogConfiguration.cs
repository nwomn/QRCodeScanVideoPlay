using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence.Configurations;

public class ScanLogConfiguration : IEntityTypeConfiguration<ScanLog>
{
    public void Configure(EntityTypeBuilder<ScanLog> builder)
    {
        builder.ToTable("scan_logs");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.QrCodeId);
        builder.Property(x => x.ClientInfo).HasMaxLength(512);
        builder.Property(x => x.FailReason).HasMaxLength(512);
        builder.Property(x => x.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.HasOne(x => x.QrCode)
            .WithMany(q => q.ScanLogs)
            .HasForeignKey(x => x.QrCodeId);
    }
}
