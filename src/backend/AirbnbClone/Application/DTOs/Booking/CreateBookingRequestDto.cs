using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Bookings;

/// <summary>
/// Request model to create a new booking (guest side)
/// </summary>
public class CreateBookingRequestDto
{
    /// <summary>
    /// Listing id to book
    /// </summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>
    /// Check-in date (ISO 8601)
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Check-out date (ISO 8601)
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Number of guests for the booking
    /// </summary>
    [Range(1, 20)]
    public int Guests { get; set; } = 1;
}

