using Core.Entities;

namespace Core.Interfaces;

/// <summary>
/// Repository interface for Message operations (Sprint 3)
/// </summary>
public interface IMessageRepository : IRepository<Message>
{
    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time - Get messages for a conversation
    /// </summary>
    Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId);

    /// <summary>
    /// Get unread messages for a user
    /// </summary>
    Task<IEnumerable<Message>> GetUnreadMessagesAsync(string userId);

    /// <summary>
    /// Mark messages as read
    /// </summary>
    Task MarkMessagesAsReadAsync(IEnumerable<int> messageIds);

    /// <summary>
    /// Get recent messages for a conversation (for real-time sync)
    /// </summary>
    Task<IEnumerable<Message>> GetRecentMessagesAsync(int conversationId, DateTime since);
}


