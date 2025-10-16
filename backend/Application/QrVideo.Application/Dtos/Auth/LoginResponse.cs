namespace QrVideo.Application.Dtos.Auth;

public record LoginResponse(string Token, DateTime ExpiresAt, string Username);
