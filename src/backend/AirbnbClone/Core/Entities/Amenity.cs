namespace Core.Entities;

public class Amenity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; } // Icon name or URL
    public string Category { get; set; } = string.Empty; // "Basic", "Safety", "Entertainment", etc.

    // Navigation Properties
    public ICollection<ListingAmenity> ListingAmenities { get; set; } = new List<ListingAmenity>();
}

