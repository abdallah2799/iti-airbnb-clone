using Core.Entities;
using Core.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Core.Interfaces;

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
            .Include(l => l.Bookings) // Include Bookings for date validation
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


    public async Task<(List<Listing> Items, int TotalCount)> GetListingsForAdminAsync(int page, int pageSize, string? status = null, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var query = _dbSet
            .Include(l => l.Host)
            .Include(l => l.Photos) // Include photos for admin gallery
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ListingStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(l => l.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var lowerTerm = search.ToLower();
            query = query.Where(l => l.Title.ToLower().Contains(lowerTerm) || 
                                     l.City.ToLower().Contains(lowerTerm) || 
                                     l.Country.ToLower().Contains(lowerTerm));
        }

        query = sortBy?.ToLower() switch
        {
            "title" => isDescending ? query.OrderByDescending(l => l.Title) : query.OrderBy(l => l.Title),
            "price" => isDescending ? query.OrderByDescending(l => l.PricePerNight) : query.OrderBy(l => l.PricePerNight),
            "status" => isDescending ? query.OrderByDescending(l => l.Status) : query.OrderBy(l => l.Status),
            "city" => isDescending ? query.OrderByDescending(l => l.City) : query.OrderBy(l => l.City),
            "country" => isDescending ? query.OrderByDescending(l => l.Country) : query.OrderBy(l => l.Country),
            "date" or "createdat" => isDescending ? query.OrderByDescending(l => l.CreatedAt) : query.OrderBy(l => l.CreatedAt),
            _ => query.OrderByDescending(l => l.CreatedAt)
        };

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

    public async Task<List<Listing>> GetRecentListingsAsync()
    {
        return await _dbSet
            .Include(l => l.Photos)
            .OrderByDescending(l => l.CreatedAt)
            .Take(5)
            .ToListAsync();
    }

    public async Task<int[]> GetMonthlyNewListingsAsync()
    {
        var monthlyCounts = new int[12];
        var currentYear = DateTime.UtcNow.Year;

        for (int month = 1; month <= 12; month++)
        {
            var count = await _dbSet
                .CountAsync(l => l.CreatedAt.Year == currentYear && l.CreatedAt.Month == month);
            monthlyCounts[month - 1] = count;
        }

        return monthlyCounts;
    }

    // In Infrastructure/Repositories/Implementation/ListingRepository.cs

    // In Infrastructure/Repositories/Implementation/ListingRepository.cs

    public async Task<bool> DeleteWithChildrenAsync(int listingId, string hostId)
    {
        // 1. Load Listing with ALL relationships that might block deletion
        var listing = await _dbSet
            .Include(l => l.Photos)
            .Include(l => l.Bookings)
            .Include(l => l.Reviews)
            // .Include(l => l.WishlistItems) // <--- UNCOMMENT IF YOU HAVE WISHLISTS
            .FirstOrDefaultAsync(l => l.Id == listingId);

        if (listing == null) return false;

        // 2. Security Check
        if (listing.HostId != hostId)
        {
            throw new UnauthorizedAccessException("You do not own this listing.");
        }

        // 3. MANUAL DELETE OF CHILDREN (The "Hard Delete")

        // Delete Bookings
        if (listing.Bookings != null && listing.Bookings.Any())
        {
            _context.Bookings.RemoveRange(listing.Bookings);
        }

        // Delete Reviews
        if (listing.Reviews != null && listing.Reviews.Any())
        {
            _context.Reviews.RemoveRange(listing.Reviews);
        }

        // Delete Photos
        if (listing.Photos != null && listing.Photos.Any())
        {
            _context.Photos.RemoveRange(listing.Photos);
        }

        // (Add Wishlists here if you have them)

        // 4. Finally, Delete the Parent
        _dbSet.Remove(listing);

        // 5. Save All Changes in one transaction
        await _context.SaveChangesAsync();
        return true;
    }

}
