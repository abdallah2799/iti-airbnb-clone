using Core.Entities;
using Core.Enums;

namespace Core.Interfaces;

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

    /// <summary>
    /// Sprint 6: Admin - Get paginated bookings with guest and host for admin dashboard
    /// </summary>
    Task<(List<Booking> Items, int TotalCount)> GetBookingsForAdminAsync(int page, int pageSize, string? status = null, string? search = null, string? sortBy = null, bool isDescending = false);

    /// <summary>
    /// Sprint 6: Admin - Check if listing has confirmed bookings
    /// </summary>
    Task<bool> HasConfirmedBookingsAsync(int listingId);


    Task<List<Booking>>  GetRecentBookingsAsync();

    Task<int[]> GetMonthlyNewBookingsAsync();
}


