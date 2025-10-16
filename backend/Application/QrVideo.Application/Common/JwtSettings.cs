namespace QrVideo.Application.Common;

public class JwtSettings
{
    public string SecretKey { get; set; } = null!;
    public string Issuer { get; set; } = "QrVideo";
    public string Audience { get; set; } = "QrVideoUsers";
    public int ExpiryMinutes { get; set; } = 60;
}
