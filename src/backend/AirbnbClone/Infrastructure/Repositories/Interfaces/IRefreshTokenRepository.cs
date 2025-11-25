using Infrastructure.Repositories; // Update namespace

public interface IRefreshTokenRepository : IRepository<RefreshToken> 
{
    Task<RefreshToken?> GetByTokenAsync(string token);
}