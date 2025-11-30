using Application.DTOs.Bookings;

namespace Application.Services.Interfaces;

/// <summary>
/// Booking service interface (guest-facing operations)
/// </summary>
public interface IBookingService
{
    /// <summary>
    /// Create a new booking (status = Pending). Validates listing existence and availability.
    /// </summary>
    Task<BookingDto> CreateBookingAsync(CreateBookingRequestDto request, string guestId);

    /// <summary>
    /// Get all bookings for a guest (most recent first)
    /// </summary>
    Task<IEnumerable<BookingDto>> GetGuestBookingsAsync(string guestId);

    /// <summary>
    /// Get detailed booking information for a booking belonging to the guest
    /// </summary>
    Task<BookingDetailDto?> GetBookingByIdAsync(int bookingId, string guestId);

    /// <summary>
    /// Update an existing booking (guest may update allowed fields while booking is Pending)
    /// </summary>
    Task<BookingDto?> UpdateBookingAsync(int bookingId, UpdateBookingRequestDto request, string guestId);

    /// <summary>
    /// Cancel a booking (guest action). Marks as Cancelled and sets CancelledAt and optional reason.
    /// </summary>
    Task CancelBookingAsync(int bookingId, string guestId, string? reason = null);
}

