using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Bookings;

/// <summary>
/// Request model to update a booking (limited updates allowed for guest)
/// </summary>
public class UpdateBookingRequestDto
{
    /// <summary>
    /// Optionally update the number of guests
    /// </summary>
    [Range(1, 20)]
    public int? Guests { get; set; }

    /// <summary>
    /// Optional cancellation reason when guest cancels via update flow
    /// </summary>
    [MaxLength(500)]
    public string? CancellationReason { get; set; }
}

