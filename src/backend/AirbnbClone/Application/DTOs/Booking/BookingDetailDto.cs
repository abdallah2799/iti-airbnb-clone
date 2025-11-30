using Core.Enums;

namespace Application.DTOs.Bookings;

/// <summary>
/// Detailed booking DTO containing related listing and guest information
/// </summary>
public class BookingDetailDto
{
    public int Id { get; set; }

    // Listing summary
    public BookingListingDto Listing { get; set; } = new();

    // Guest summary
    public BookingGuestDto Guest { get; set; } = new();

    // Dates & guests
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Guests { get; set; }

    // Pricing & status
    public decimal TotalPrice { get; set; }
    public decimal? CleaningFee { get; set; }
    public decimal? ServiceFee { get; set; }
    public string Currency { get; set; } = "EGP";
    public BookingStatus Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DateTime CreatedAt { get; set; }

    // Cancellation / Refund
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }
}

/// <summary>
/// Compact listing info used inside BookingDetailDto
/// </summary>
public class BookingListingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CoverPhotoUrl { get; set; }
    public string HostId { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;
}

/// <summary>
/// Compact guest info used inside BookingDetailDto
/// </summary>
public class BookingGuestDto
{
    public string GuestId { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? GuestProfilePicture { get; set; }
}

