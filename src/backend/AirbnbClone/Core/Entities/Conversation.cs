namespace Core.Entities;

public class Conversation
{
    public int Id { get; set; }

    // Foreign Keys
    public string GuestId { get; set; } = string.Empty;
    public string HostId { get; set; } = string.Empty;
    public int ListingId { get; set; }

    // Navigation Properties
    public ApplicationUser Guest { get; set; } = null!;
    public ApplicationUser Host { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
