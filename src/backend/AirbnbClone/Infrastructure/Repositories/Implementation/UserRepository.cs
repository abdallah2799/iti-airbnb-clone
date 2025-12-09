using Core.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Core.Interfaces;

namespace Infrastructure.Repositories;

/// <summary>
/// Implementation of User repository
/// </summary>
public class UserRepository : Repository<ApplicationUser>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<ApplicationUser?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<ApplicationUser?> GetByExternalLoginAsync(string provider, string providerKey)
    {
        // TODO: Sprint 0 - Story: Register/Login with Google
        // Use UserManager.FindByLoginAsync() instead in the service layer
        // This method is a placeholder for direct database queries if needed
        throw new NotImplementedException("Use UserManager.FindByLoginAsync() in the service layer");
    }

    public async Task<bool> UpdateProfileAsync(string userId, string? bio, string? profilePictureUrl)
    {
        var user = await _dbSet.FindAsync(userId);
        if (user == null)
            return false;

        user.Bio = bio;
        user.ProfilePictureUrl = profilePictureUrl;
        
        return true; // Changes will be saved by UnitOfWork
    }

    public async Task<ApplicationUser?> GetWithListingsAsync(string userId)
    {
        return await _dbSet
            .Include(u => u.Listings)
            .ThenInclude(l => l.Photos)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<ApplicationUser?> GetWithBookingsAsync(string userId)
    {
        return await _dbSet
            .Include(u => u.Bookings)
            .ThenInclude(b => b.Listing)
            .ThenInclude(l => l.Photos)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<int[]> GetMonthlyNewUsersAsync()
    {
        var monthlyCounts = new int[12];
        var currentYear = DateTime.UtcNow.Year;

        for (int month = 1; month <= 12; month++)
        {
            var count = await _dbSet
                .CountAsync(u => u.CreatedAt.Year == currentYear && u.CreatedAt.Month == month);
            monthlyCounts[month - 1] = count;
        }

        return monthlyCounts;
    }

}
