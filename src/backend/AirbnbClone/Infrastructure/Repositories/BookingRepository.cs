using Core.Entities;
using Core.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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
}
