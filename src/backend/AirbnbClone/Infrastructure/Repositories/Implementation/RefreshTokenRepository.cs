using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Repositories;
using Core.Interfaces;
using Infrastructure.Data;

public class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens
                             .FirstOrDefaultAsync(x => x.Token == token);
    }
}
