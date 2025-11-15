using Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Core Entities
    public DbSet<Listing> Listings { get; set; }
    public DbSet<Photo> Photos { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<UserWishlist> UserWishlists { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    // Enhanced Entities
    public DbSet<Amenity> Amenities { get; set; }
    public DbSet<ListingAmenity> ListingAmenities { get; set; }
    public DbSet<BlockedDate> BlockedDates { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
