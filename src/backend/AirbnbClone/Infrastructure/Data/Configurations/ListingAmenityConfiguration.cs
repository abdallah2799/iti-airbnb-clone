using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ListingAmenityConfiguration : IEntityTypeConfiguration<ListingAmenity>
{
    public void Configure(EntityTypeBuilder<ListingAmenity> builder)
    {
        builder.HasKey(la => new { la.ListingId, la.AmenityId });

        builder.HasOne(la => la.Listing)
            .WithMany(l => l.ListingAmenities)
            .HasForeignKey(la => la.ListingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(la => la.Amenity)
            .WithMany(a => a.ListingAmenities)
            .HasForeignKey(la => la.AmenityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
