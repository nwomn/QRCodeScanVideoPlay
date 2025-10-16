using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using QrVideo.Application.Common;
using QrVideo.Application.Dtos.Auth;
using QrVideo.Application.Interfaces.Services;
using QrVideo.Domain.Entities;
using QrVideo.Infrastructure.Persistence;

namespace QrVideo.Infrastructure.Services;

public class AuthService(
    AppDbContext dbContext,
    IOptions<JwtSettings> jwtOptions,
    ILogger<AuthService> logger,
    Microsoft.AspNetCore.Identity.IPasswordHasher<AdminUser> passwordHasher
) : IAuthService
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;
    private readonly ILogger<AuthService> _logger = logger;
    private readonly Microsoft.AspNetCore.Identity.IPasswordHasher<AdminUser> _passwordHasher = passwordHasher;

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.AdminUsers
            .FirstOrDefaultAsync(x => x.Username == request.Username, cancellationToken);

        if (user is null || user.IsActive is false)
        {
            _logger.LogWarning("Login failed for user {Username}: user not found or inactive", request.Username);
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Login failed for user {Username}: invalid password", request.Username);
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return new LoginResponse(tokenString, expires, user.Username);
    }
}
