namespace Core.Entities;

public class Review
{
    public int Id { get; set; }
    
    // Overall Rating (1-5, required)
    public int Rating { get; set; }
    
    // Detailed Ratings (1-5, all nullable for MVP flexibility)
    public int? CleanlinessRating { get; set; }
    public int? AccuracyRating { get; set; }
    public int? CommunicationRating { get; set; }
    public int? LocationRating { get; set; }
    public int? CheckInRating { get; set; }
    public int? ValueRating { get; set; }
    
    // Review Content
    public string Comment { get; set; } = string.Empty;
    public DateTime DatePosted { get; set; }

    // Foreign Keys
    public int BookingId { get; set; }
    public int ListingId { get; set; }
    public string GuestId { get; set; } = string.Empty;

    // Navigation Properties
    public Booking Booking { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
    public ApplicationUser Guest { get; set; } = null!;
}

