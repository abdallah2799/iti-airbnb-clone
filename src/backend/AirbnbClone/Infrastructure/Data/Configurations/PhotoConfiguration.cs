using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Url)
            .IsRequired()
            .HasMaxLength(500);

        builder.HasOne(p => p.Listing)
            .WithMany(l => l.Photos)
            .HasForeignKey(p => p.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
