using Core.Entities;
using Core.Enums;
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

    public async Task<Listing?> GetListingWithDetailsandBookingsAsync(int listingId)
    {
        return await _dbSet
            .Include(l => l.Photos)
            .Include(l => l.Host)
            .Include(l => l.Reviews)
                .ThenInclude(r => r.Guest)
            .Include(l => l.ListingAmenities)
                .ThenInclude(la => la.Amenity)
                .Include(l => l.Photos)
                .Include(l => l.Bookings)
            .ThenInclude(b => b.Guest)
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
            .Include(l => l.Bookings)
            .ThenInclude(b => b.Guest)
            .Include(l => l.ListingAmenities)
            .ThenInclude(la => la.Amenity)
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

    public async Task<IEnumerable<Listing>> GetListingsInAreaAsync(double minLat, double maxLat, double minLng, double maxLng, int guests)
    {
        var query = _dbSet
            .Include(l => l.Photos) 
            .Where(l =>
                l.Status == ListingStatus.Published &&
                l.Latitude >= minLat && l.Latitude <= maxLat &&
                l.Longitude >= minLng && l.Longitude <= maxLng);

        if (guests > 0)
        {
            query = query.Where(l => l.MaxGuests >= guests);
        }

        return await query.ToListAsync();
    }


    public async Task<(List<Listing> Items, int TotalCount)> GetListingsForAdminAsync(int page, int pageSize)
    {
        var query = _dbSet
            .Include(l => l.Host)
            .OrderBy(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // override GetAllAsync to include all
    public override async Task<IEnumerable<Listing>> GetAllAsync()
    {
        return await _dbSet
        .Include(l => l.ListingAmenities)
            .ThenInclude(la => la.Amenity) 
        .ToListAsync();
    }
}
