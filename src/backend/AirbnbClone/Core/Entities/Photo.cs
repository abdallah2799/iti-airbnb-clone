namespace Core.Entities;

public class Photo
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsCover { get; set; }

    // Foreign Keys
    public int ListingId { get; set; }

    // Navigation Properties
    public Listing Listing { get; set; } = null!;
}

