using Core.Entities;
using Core.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Core.Interfaces;

namespace Infrastructure.Repositories;

/// <summary>
/// Implementation of Booking repository
/// </summary>
public class BookingRepository : Repository<Booking>, IBookingRepository
{
    public BookingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Booking?> GetBookingWithDetailsAsync(int bookingId)
    {
        return await _dbSet
            .Include(b => b.Listing)
                .ThenInclude(l => l.Photos)
            .Include(b => b.Guest)
            .FirstOrDefaultAsync(b => b.Id == bookingId);
    }

    public async Task<IEnumerable<Booking>> GetGuestBookingsAsync(string guestId)
    {
        return await _dbSet
            .Include(b => b.Listing)
                .ThenInclude(l => l.Photos)
            .Include(b => b.Listing.Host)
            .Where(b => b.GuestId == guestId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetHostReservationsAsync(string hostId)
    {
        return await _dbSet
            .Include(b => b.Listing)
            .Include(b => b.Guest)
            .Where(b => b.Listing.HostId == hostId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetBookingsByStatusAsync(BookingStatus status)
    {
        return await _dbSet
            .Include(b => b.Listing)
            .Include(b => b.Guest)
            .Where(b => b.Status == status)
            .ToListAsync();
    }

    public async Task<bool> IsListingAvailableAsync(int listingId, DateTime startDate, DateTime endDate)
    {
        // Check if there are any conflicting bookings
        var hasConflict = await _dbSet
            .AnyAsync(b => 
                b.ListingId == listingId &&
                b.Status != BookingStatus.Cancelled &&
                startDate < b.EndDate && 
                endDate > b.StartDate);

        return !hasConflict;
    }

    public async Task<IEnumerable<Booking>> GetListingUpcomingBookingsAsync(int listingId)
    {
        var now = DateTime.UtcNow;
        return await _dbSet
            .Include(b => b.Guest)
            .Where(b => 
                b.ListingId == listingId &&
                b.StartDate > now &&
                b.Status == BookingStatus.Confirmed)
            .OrderBy(b => b.StartDate)
            .ToListAsync();
    }

    public async Task<(List<Booking> Items, int TotalCount)> GetBookingsForAdminAsync(int page, int pageSize, string? status = null, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var query = _dbSet
            .Include(b => b.Guest)
            .Include(b => b.Listing)
                .ThenInclude(l => l.Host)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(b => b.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var lowerTerm = search.ToLower();
            // Try to parse as int for ID search, otherwise search strings
            if (int.TryParse(search, out int id))
            {
                query = query.Where(b => b.Id == id);
            }
            else
            {
                query = query.Where(b => b.Guest.FullName.ToLower().Contains(lowerTerm) || 
                                         b.Guest.Email.ToLower().Contains(lowerTerm) ||
                                         b.Guest.Email.ToLower().Contains(lowerTerm) ||
                                         b.Listing.Title.ToLower().Contains(lowerTerm));
            }
        }

        query = sortBy?.ToLower() switch
        {
            "guest" => isDescending ? query.OrderByDescending(b => b.Guest.FullName) : query.OrderBy(b => b.Guest.FullName),
            "listing" => isDescending ? query.OrderByDescending(b => b.Listing.Title) : query.OrderBy(b => b.Listing.Title),
            "totalprice" => isDescending ? query.OrderByDescending(b => b.TotalPrice) : query.OrderBy(b => b.TotalPrice),
            "status" => isDescending ? query.OrderByDescending(b => b.Status) : query.OrderBy(b => b.Status),
            "startdate" => isDescending ? query.OrderByDescending(b => b.StartDate) : query.OrderBy(b => b.StartDate),
            "enddate" => isDescending ? query.OrderByDescending(b => b.EndDate) : query.OrderBy(b => b.EndDate),
            "date" or "createdat" => isDescending ? query.OrderByDescending(b => b.CreatedAt) : query.OrderBy(b => b.CreatedAt),
            _ => query.OrderByDescending(b => b.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<bool> HasConfirmedBookingsAsync(int listingId)
    {
        return await _dbSet
            .AnyAsync(b => b.ListingId == listingId && b.Status == BookingStatus.Confirmed);
    }

    public async Task<List<Booking>> GetRecentBookingsAsync()
    {
        return await _dbSet
            .Include(b => b.Listing)
            .Include(b => b.Guest)
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .ToListAsync();
    }

    public async Task<int[]> GetMonthlyNewBookingsAsync()
    {
        var monthlyCounts = new int[12];
        var currentYear = DateTime.UtcNow.Year;

        for (int month = 1; month <= 12; month++)
        {
            var count = await _dbSet
                .CountAsync(b => b.CreatedAt.Year == currentYear && b.CreatedAt.Month == month);
            monthlyCounts[month - 1] = count;
        }

        return monthlyCounts;
    }
}
