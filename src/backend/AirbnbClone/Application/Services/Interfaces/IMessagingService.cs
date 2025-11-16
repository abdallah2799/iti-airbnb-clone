namespace Application.Services.Interfaces;

/// <summary>
/// Messaging service interface for real-time chat (Sprint 3)
/// </summary>
public interface IMessagingService
{
    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time
    /// Send a message in a conversation
    /// </summary>
    /// <param name="conversationId">Conversation ID</param>
    /// <param name="senderId">Sender user ID</param>
    /// <param name="content">Message content</param>
    /// <returns>Created message ID</returns>
    Task<int> SendMessageAsync(int conversationId, string senderId, string content);

    /// <summary>
    /// Story: [M] Contact Host from Listing
    /// Create or get conversation between guest and host for a listing
    /// </summary>
    /// <param name="guestId">Guest user ID</param>
    /// <param name="hostId">Host user ID</param>
    /// <param name="listingId">Listing ID</param>
    /// <returns>Conversation ID</returns>
    Task<int> CreateOrGetConversationAsync(string guestId, string hostId, int listingId);

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// Get all messages in a conversation
    /// </summary>
    /// <param name="conversationId">Conversation ID</param>
    /// <returns>List of messages</returns>
    Task<object> GetConversationMessagesAsync(int conversationId);

    /// <summary>
    /// Get all conversations for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>List of conversations</returns>
    Task<object> GetUserConversationsAsync(string userId);

    /// <summary>
    /// Mark messages as read
    /// </summary>
    /// <param name="messageIds">List of message IDs</param>
    /// <param name="userId">User ID marking as read</param>
    Task MarkAsReadAsync(List<int> messageIds, string userId);
}
