// File: Application/DTOs/Listing/ListingDetailDto.cs

using Core.Enums;

namespace Application.DTOs.Listing;

/// <summary>
/// DTO for detailed listing view with all information
/// </summary>
public class ListingDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Pricing
    public decimal PricePerNight { get; set; }
    public decimal? CleaningFee { get; set; }
    public decimal? ServiceFee { get; set; }
    public string Currency { get; set; } = "USD";

    // Property Details
    public int MaxGuests { get; set; }
    public int NumberOfBedrooms { get; set; }
    public int NumberOfBathrooms { get; set; }
    public PropertyType PropertyType { get; set; }

    // Location
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Booking Rules
    public int? MinimumNights { get; set; }
    public int? MaximumNights { get; set; }
    public TimeSpan? CheckInTime { get; set; }
    public TimeSpan? CheckOutTime { get; set; }
    public CancellationPolicy? CancellationPolicy { get; set; }
    public bool InstantBooking { get; set; }

    // Photos
    public List<PhotoguestDto> Photos { get; set; } = new();

    // Amenities
    public List<AmenityDto> Amenities { get; set; } = new();

    // Reviews
    public List<ReviewSummaryDto> Reviews { get; set; } = new();
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }

    // Host Information
    public HostInfoDto Host { get; set; } = new();

    // Timestamps
    public DateTime CreatedAt { get; set; }
}