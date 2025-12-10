using Microsoft.AspNetCore.Identity;

namespace Core.Entities;

public class ApplicationUser : IdentityUser
{
    // Profile Information
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? FullName { get; set; } // For Google OAuth and profile
    public string? GoogleId { get; set; } // For Google OAuth unique identifier
    
    // Verification Status (Enhanced - All nullable for gradual implementation)
    public bool PhoneNumberVerified { get; set; } = false;
    public bool GovernmentIdVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    
    // Host-specific Metrics (nullable, only applies to hosts)
    public decimal? HostResponseRate { get; set; } // Percentage 0-100
    public int? HostResponseTimeMinutes { get; set; } // Average response time in minutes
    public bool IsSuspended { get; set; } = false;
    public DateTime? HostSince { get; set; } // When they became a host
    
    // Account Management
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation Properties
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Conversation> ConversationsAsGuest { get; set; } = new List<Conversation>();
    public ICollection<Conversation> ConversationsAsHost { get; set; } = new List<Conversation>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<UserWishlist> UserWishlists { get; set; } = new List<UserWishlist>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

