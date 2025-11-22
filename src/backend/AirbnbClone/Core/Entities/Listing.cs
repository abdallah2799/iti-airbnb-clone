using Core.Enums;

namespace Core.Entities;

public class Listing
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Pricing (Core + Enhanced)
    public decimal PricePerNight { get; set; }
    public decimal? CleaningFee { get; set; }
    public decimal? ServiceFee { get; set; }
    public string Currency { get; set; } = "EGP"; // Default currency
    
    // Property Details
    public int MaxGuests { get; set; }
    public int NumberOfBedrooms { get; set; }
    public int NumberOfBathrooms { get; set; }
    public PropertyType? PropertyType { get; set; }
    public PrivacyType? PrivacyType { get; set; }



    // Location
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    // Booking Rules (Enhanced - All Nullable for MVP)
    public int? MinimumNights { get; set; }
    public int? MaximumNights { get; set; }
    public TimeSpan? CheckInTime { get; set; }
    public TimeSpan? CheckOutTime { get; set; }
    public CancellationPolicy? CancellationPolicy { get; set; }
    public bool InstantBooking { get; set; } = false;
    
    // Status & Management
    public ListingStatus Status { get; set; } = ListingStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Foreign Keys
    public string HostId { get; set; } = string.Empty;

    // Navigation Properties
    public ApplicationUser Host { get; set; } = null!;
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    public ICollection<UserWishlist> UserWishlists { get; set; } = new List<UserWishlist>();
    public ICollection<ListingAmenity> ListingAmenities { get; set; } = new List<ListingAmenity>();
    public ICollection<BlockedDate> BlockedDates { get; set; } = new List<BlockedDate>();
}
