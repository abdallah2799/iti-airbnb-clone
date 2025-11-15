using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.TotalPrice)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(b => b.CleaningFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(b => b.ServiceFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(b => b.RefundAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(b => b.StripePaymentIntentId)
            .HasMaxLength(200);

        builder.Property(b => b.CancellationReason)
            .HasMaxLength(500);

        builder.HasOne(b => b.Guest)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Listing)
            .WithMany(l => l.Bookings)
            .HasForeignKey(b => b.ListingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
