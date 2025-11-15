using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ListingConfiguration : IEntityTypeConfiguration<Listing>
{
    public void Configure(EntityTypeBuilder<Listing> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(l => l.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(l => l.PricePerNight)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.CleaningFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(l => l.ServiceFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(l => l.Currency)
            .HasMaxLength(10)
            .HasDefaultValue("USD");

        builder.Property(l => l.Address)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(l => l.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.Country)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.Status)
            .HasDefaultValue(Core.Enums.ListingStatus.Draft);

        builder.HasOne(l => l.Host)
            .WithMany(u => u.Listings)
            .HasForeignKey(l => l.HostId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
