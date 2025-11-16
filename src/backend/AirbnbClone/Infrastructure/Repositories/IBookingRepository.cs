using Core.Entities;
using Core.Enums;

namespace Infrastructure.Repositories;

/// <summary>
/// Repository interface for Booking operations (Sprint 2)
/// </summary>
public interface IBookingRepository : IRepository<Booking>
{
    /// <summary>
    /// Story: [M] Securely Pay for Booking - Create booking after payment
    /// </summary>
    Task<Booking?> GetBookingWithDetailsAsync(int bookingId);

    /// <summary>
    /// Story: [S] View My Bookings (Guest) - Get all bookings for a guest
    /// </summary>
    Task<IEnumerable<Booking>> GetGuestBookingsAsync(string guestId);

    /// <summary>
    /// Story: [S] View My Reservations (Host) - Get all reservations for host's listings
    /// </summary>
    Task<IEnumerable<Booking>> GetHostReservationsAsync(string hostId);

    /// <summary>
    /// Get bookings by status
    /// </summary>
    Task<IEnumerable<Booking>> GetBookingsByStatusAsync(BookingStatus status);

    /// <summary>
    /// Check if listing is available for dates
    /// </summary>
    Task<bool> IsListingAvailableAsync(int listingId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get upcoming bookings for a listing
    /// </summary>
    Task<IEnumerable<Booking>> GetListingUpcomingBookingsAsync(int listingId);
}
