// File: Application/DTOs/Listing/ListingCardDto.cs

using Core.Enums;

namespace Application.DTOs.Listing;

/// <summary>
/// DTO for listing card display on homepage and search results
/// Contains minimal data needed for grid/list view
/// </summary>
public class ListingCardDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string Currency { get; set; } = "USD";
    public PropertyType PropertyType { get; set; }
    public int MaxGuests { get; set; }
    public int NumberOfBedrooms { get; set; }
    public int NumberOfBathrooms { get; set; }

    // Location
    public string? Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Cover photo
    public string? CoverPhotoUrl { get; set; }

    // Rating summary
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }

    // Host info
    public string HostId { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;
    public bool IsSuperHost { get; set; }
}







