namespace QrVideo.Application.Common;

public class StorageSettings
{
    public string BasePath { get; set; } = "storage";
    public string PublicBaseUrl { get; set; } = ""; // to be filled with domain or origin
    public string BaseUrl { get; set; } = ""; // Base URL for QR code generation
}
