using Core.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Implementation of Message repository
/// </summary>
public class MessageRepository : Repository<Message>, IMessageRepository
{
    public MessageRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId)
    {
        return await _dbSet
            .Where(m => m.ConversationId == conversationId)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetUnreadMessagesAsync(string userId)
    {
        return await _dbSet
            .Include(m => m.Conversation)
            .Include(m => m.Sender)
            .Where(m => !m.IsRead && 
                   (m.Conversation.GuestId == userId || m.Conversation.HostId == userId) &&
                   m.SenderId != userId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task MarkMessagesAsReadAsync(IEnumerable<int> messageIds)
    {
        var messages = await _dbSet
            .Where(m => messageIds.Contains(m.Id))
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
        }
    }

    public async Task<IEnumerable<Message>> GetRecentMessagesAsync(int conversationId, DateTime since)
    {
        return await _dbSet
            .Where(m => m.ConversationId == conversationId && m.Timestamp > since)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }
}
