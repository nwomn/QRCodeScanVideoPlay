using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QrVideo.Application.Common;
using QrVideo.Application.Interfaces.Infrastructure;
using QrVideo.Domain.Entities;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class DatabaseInitializer(
    AppDbContext dbContext,
    IOptions<AdminUserSeedSettings> adminOptions,
    Microsoft.AspNetCore.Identity.IPasswordHasher<AdminUser> passwordHasher,
    ILogger<DatabaseInitializer> logger
) : IDatabaseInitializer
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly AdminUserSeedSettings _adminSettings = adminOptions.Value;
    private readonly Microsoft.AspNetCore.Identity.IPasswordHasher<AdminUser> _passwordHasher = passwordHasher;
    private readonly ILogger<DatabaseInitializer> _logger = logger;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.Database.MigrateAsync(cancellationToken);
        await EnsureAdminUserAsync(cancellationToken);
    }

    private async Task EnsureAdminUserAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.AdminUsers.AnyAsync(cancellationToken))
        {
            return;
        }

        var admin = new AdminUser
        {
            Username = _adminSettings.Username,
            PasswordHash = string.Empty,
            CreatedAt = DateTime.UtcNow
        };
        admin.PasswordHash = _passwordHasher.HashPassword(admin, _adminSettings.Password);
        _dbContext.AdminUsers.Add(admin);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Default admin user created with username {Username}", admin.Username);
    }
}
