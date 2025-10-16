namespace QrVideo.Application.Interfaces.Infrastructure;

public interface IDatabaseInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
