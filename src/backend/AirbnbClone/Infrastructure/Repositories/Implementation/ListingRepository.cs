using Core.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Implementation of Listing repository
/// </summary>
public class ListingRepository : Repository<Listing>, IListingRepository
{
    public ListingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Listing?> GetListingWithDetailsAsync(int listingId)
    {
        return await _dbSet
            .Include(l => l.Photos)
            .Include(l => l.Host)
            .Include(l => l.Reviews)
                .ThenInclude(r => r.Guest)
            .Include(l => l.ListingAmenities)
                .ThenInclude(la => la.Amenity)
                .Include(l => l.Photos)
            .FirstOrDefaultAsync(l => l.Id == listingId);
    }

    public async Task<IEnumerable<Listing>> GetAllListingsWithPhotosAsync()
    {
        return await _dbSet
            .Include(l => l.Photos.Where(p => p.IsCover))
            .Include(l => l.Reviews)
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> SearchByLocationAsync(string location)
    {
        return await _dbSet
            .Include(l => l.Photos.Where(p => p.IsCover))
            .Where(l => l.City.Contains(location) || l.Country.Contains(location))
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> SearchByAvailableDatesAsync(DateTime startDate, DateTime endDate)
    {
        // Story: [S] Search by Available Dates
        // Filter out listings that have conflicting bookings or blocked dates
        return await _dbSet
            .Include(l => l.Photos.Where(p => p.IsCover))
            .Include(l => l.Bookings)
            .Include(l => l.BlockedDates)
            .Where(l => 
                // No bookings that overlap with requested dates
                !l.Bookings.Any(b => startDate < b.EndDate && endDate > b.StartDate) &&
                // No blocked dates that overlap with requested dates
                !l.BlockedDates.Any(bd => startDate <= bd.Date && endDate >= bd.Date))
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> FilterByGuestsAsync(int numberOfGuests)
    {
        return await _dbSet
            .Include(l => l.Photos.Where(p => p.IsCover))
            .Where(l => l.MaxGuests >= numberOfGuests)
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> GetHostListingsAsync(string hostId)
    {
        return await _dbSet
            .Include(l => l.Photos)
            .Include(l => l.Reviews)
            .Where(l => l.HostId == hostId)
            .ToListAsync();
    }

    public async Task<Listing?> GetListingWithReviewsAsync(int listingId)
    {
        return await _dbSet
            .Include(l => l.Reviews)
                .ThenInclude(r => r.Guest)
            .FirstOrDefaultAsync(l => l.Id == listingId);
    }
}
