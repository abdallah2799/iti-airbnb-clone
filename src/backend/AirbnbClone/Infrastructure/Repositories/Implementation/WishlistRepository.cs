using Core.Entities;
using Infrastructure.Data;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;

public class WishlistRepository : IWishlistRepository
{
    private readonly ApplicationDbContext _context;

    public WishlistRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserWishlist?> GetWishlistItemAsync(string userId, int listingId)
    {
        return await _context.UserWishlists
            .FirstOrDefaultAsync(w => w.ApplicationUserId == userId && w.ListingId == listingId);
    }

    public async Task<IEnumerable<UserWishlist>> GetUserWishlistAsync(string userId)
    {
        return await _context.UserWishlists
            .Include(w => w.Listing)
                .ThenInclude(l => l.Photos)
            .Include(w => w.Listing)
                .ThenInclude(l => l.Reviews)
            .Include(w => w.Listing)
                .ThenInclude(l => l.Host)
            .Where(w => w.ApplicationUserId == userId)
            .OrderByDescending(w => w.ListingId)
            .ToListAsync();
    }

    public async Task AddToWishlistAsync(UserWishlist wishlistItem)
    {
        await _context.UserWishlists.AddAsync(wishlistItem);
    }

    public async Task RemoveFromWishlistAsync(UserWishlist wishlistItem)
    {
        _context.UserWishlists.Remove(wishlistItem);
    }

    public async Task<bool> IsInWishlistAsync(string userId, int listingId)
    {
        return await _context.UserWishlists
            .AnyAsync(w => w.ApplicationUserId == userId && w.ListingId == listingId);
    }

    public async Task<int> GetWishlistCountAsync(string userId)
    {
        return await _context.UserWishlists
            .CountAsync(w => w.ApplicationUserId == userId);
    }
}


