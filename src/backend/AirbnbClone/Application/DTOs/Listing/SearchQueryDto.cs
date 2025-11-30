// File: Application/DTOs/Listing/SearchQueryDto.cs
namespace Application.DTOs.Listing;

/// <summary>
/// DTO for search and filter criteria
/// </summary>
public class SearchQueryDto
{
    public string? Location { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Guests { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? PropertyType { get; set; }
    public int? MinBedrooms { get; set; }
    public List<int>? AmenityIds { get; set; }
}

