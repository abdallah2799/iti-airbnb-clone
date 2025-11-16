using Core.Entities;

namespace Infrastructure.Repositories;

/// <summary>
/// Repository interface for Conversation operations (Sprint 3)
/// </summary>
public interface IConversationRepository : IRepository<Conversation>
{
    /// <summary>
    /// Story: [M] Contact Host from Listing - Find existing conversation between guest and host
    /// </summary>
    Task<Conversation?> GetConversationBetweenUsersAsync(string guestId, string hostId, int? listingId = null);

    /// <summary>
    /// Story: [M] View Past Conversation History - Get all conversations for a user
    /// </summary>
    Task<IEnumerable<Conversation>> GetUserConversationsAsync(string userId);

    /// <summary>
    /// Get conversation with all messages
    /// </summary>
    Task<Conversation?> GetConversationWithMessagesAsync(int conversationId);

    /// <summary>
    /// Get conversation with participants info
    /// </summary>
    Task<Conversation?> GetConversationWithParticipantsAsync(int conversationId);
}
