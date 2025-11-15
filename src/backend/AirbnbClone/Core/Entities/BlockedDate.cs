namespace Core.Entities;

public class BlockedDate
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string? Reason { get; set; } // "Booked", "Maintenance", "Host blocked"

    // Foreign Keys
    public int ListingId { get; set; }

    // Navigation Properties
    public Listing Listing { get; set; } = null!;
}
