namespace Core.Entities;

public class ListingAmenity
{
    // Composite Primary Key
    public int ListingId { get; set; }
    public int AmenityId { get; set; }

    // Navigation Properties
    public Listing Listing { get; set; } = null!;
    public Amenity Amenity { get; set; } = null!;
}
