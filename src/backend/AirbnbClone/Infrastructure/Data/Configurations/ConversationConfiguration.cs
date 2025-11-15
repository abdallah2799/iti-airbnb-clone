using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Guest)
            .WithMany(u => u.ConversationsAsGuest)
            .HasForeignKey(c => c.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Host)
            .WithMany(u => u.ConversationsAsHost)
            .HasForeignKey(c => c.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Listing)
            .WithMany(l => l.Conversations)
            .HasForeignKey(c => c.ListingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
