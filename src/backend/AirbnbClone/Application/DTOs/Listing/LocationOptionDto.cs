namespace Application.DTOs.Listing;

/// <summary>
/// Represents a unique location (city) with listing count
/// </summary>
public class LocationOptionDto
{
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int ListingCount { get; set; }
}
