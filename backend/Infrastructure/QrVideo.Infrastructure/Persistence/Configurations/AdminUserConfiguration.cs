using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrVideo.Domain.Entities;

namespace QrVideo.Infrastructure.Persistence.Configurations;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.ToTable("admin_users");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Username).IsUnique();
        builder.Property(x => x.Username).IsRequired().HasMaxLength(64);
        builder.Property(x => x.PasswordHash).IsRequired().HasMaxLength(256);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
