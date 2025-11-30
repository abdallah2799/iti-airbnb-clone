using Core.Enums;

namespace Application.DTOs.Bookings;

/// <summary>
/// Lightweight booking DTO for list views (guest booking list)
/// </summary>
public class BookingDto
{
    public int Id { get; set; }

    // Listing
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public string? ListingCoverPhoto { get; set; }

    // Dates & guests
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Guests { get; set; }

    // Pricing & status
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "EGP";
    public BookingStatus Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }

    // Host
    public string HostId { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;

    // Metadata
    public DateTime CreatedAt { get; set; }
}

