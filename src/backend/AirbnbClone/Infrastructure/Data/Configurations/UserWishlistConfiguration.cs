using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class UserWishlistConfiguration : IEntityTypeConfiguration<UserWishlist>
{
    public void Configure(EntityTypeBuilder<UserWishlist> builder)
    {
        builder.HasKey(uw => new { uw.ApplicationUserId, uw.ListingId });

        builder.HasOne(uw => uw.ApplicationUser)
            .WithMany(u => u.UserWishlists)
            .HasForeignKey(uw => uw.ApplicationUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(uw => uw.Listing)
            .WithMany(l => l.UserWishlists)
            .HasForeignKey(uw => uw.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
