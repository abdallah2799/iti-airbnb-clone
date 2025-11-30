using Core.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Core.Interfaces;

namespace Infrastructure.Repositories;

/// <summary>
/// Implementation of Conversation repository
/// </summary>
public class ConversationRepository : Repository<Conversation>, IConversationRepository
{
    public ConversationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Conversation?> GetConversationBetweenUsersAsync(string guestId, string hostId, int? listingId = null)
    {
        var query = _dbSet
            .Where(c => c.GuestId == guestId && c.HostId == hostId);

        if (listingId.HasValue)
        {
            query = query.Where(c => c.ListingId == listingId.Value);
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Conversation>> GetUserConversationsAsync(string userId)
    {
        return await _dbSet
            .Where(c => c.GuestId == userId || c.HostId == userId)
            .Include(c => c.Guest)
            .Include(c => c.Host)
            .Include(c => c.Listing)
            .Include(c => c.Messages)
            .ToListAsync();
    }

    public async Task<Conversation?> GetConversationWithMessagesAsync(int conversationId)
    {
        return await _dbSet
            .Include(c => c.Messages.OrderBy(m => m.Timestamp))
            .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(c => c.Id == conversationId);
    }

    public async Task<Conversation?> GetConversationWithParticipantsAsync(int conversationId)
    {
        return await _dbSet
            .Include(c => c.Guest)
            .Include(c => c.Host)
            .Include(c => c.Listing)
            .FirstOrDefaultAsync(c => c.Id == conversationId);
    }
}
