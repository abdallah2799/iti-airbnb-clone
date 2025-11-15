namespace Core.Entities;

public class UserWishlist
{
    // Composite Primary Key
    public string ApplicationUserId { get; set; } = string.Empty;
    public int ListingId { get; set; }

    // Navigation Properties
    public ApplicationUser ApplicationUser { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
