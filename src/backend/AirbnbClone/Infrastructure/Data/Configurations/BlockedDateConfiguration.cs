using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BlockedDateConfiguration : IEntityTypeConfiguration<BlockedDate>
{
    public void Configure(EntityTypeBuilder<BlockedDate> builder)
    {
        builder.HasKey(bd => bd.Id);

        builder.Property(bd => bd.Date)
            .IsRequired();

        builder.Property(bd => bd.Reason)
            .HasMaxLength(200);

        builder.HasOne(bd => bd.Listing)
            .WithMany(l => l.BlockedDates)
            .HasForeignKey(bd => bd.ListingId)
            .OnDelete(DeleteBehavior.Cascade);

        // Create index for faster date lookups
        builder.HasIndex(bd => new { bd.ListingId, bd.Date });
    }
}
