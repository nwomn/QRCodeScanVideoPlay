using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QrVideo.Application.Common;
using QrVideo.Application.Interfaces.Infrastructure;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Application.Interfaces.Storage;
using QrVideo.Domain.Entities;
using QrVideo.Infrastructure.Persistence;
using QrVideo.Infrastructure.QrGeneration;
using QrVideo.Infrastructure.Services;
using QrVideo.Infrastructure.Storage;

namespace QrVideo.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorageSettings>(configuration.GetSection("Storage"));
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<AdminUserSeedSettings>(configuration.GetSection("DefaultAdmin"));

        var connectionString = configuration.GetConnectionString("Default")
                               ?? "Host=localhost;Database=qrvideo;Username=postgres;Password=postgres";

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IVideoService, VideoService>();
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<ILogService, LogService>();
        services.AddScoped<IStatsService, StatsService>();
        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddScoped<IQrCodeGenerator, QrCodeGenerator>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();
        services.AddScoped<Microsoft.AspNetCore.Identity.IPasswordHasher<AdminUser>, Microsoft.AspNetCore.Identity.PasswordHasher<AdminUser>>();

        return services;
    }
}
