using Application.DTOs.Messaging;

namespace Application.Services.Interfaces;

/// <summary>
/// Messaging service interface for real-time chat (Sprint 3)
/// </summary>
public interface IMessagingService
{
    /// <summary>
    /// Story: [M] Contact Host from Listing
    /// Create or get conversation between guest and host for a listing
    /// </summary>
    Task<ConversationDto> CreateOrGetConversationAsync(string guestId, string hostId, int listingId, string? initialMessage = null);

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// Get all conversations for a user
    /// </summary>
    Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId);

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// Get all messages in a conversation
    /// </summary>
    Task<ConversationDetailDto?> GetConversationMessagesAsync(int conversationId, string userId);

    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time
    /// Send a message in a conversation
    /// </summary>
    Task<MessageDto> SendMessageAsync(int conversationId, string senderId, string content);

    /// <summary>
    /// Mark messages as read
    /// </summary>
    Task MarkMessagesAsReadAsync(List<int> messageIds, string userId);

    /// <summary>
    /// Check if user is participant in conversation
    /// </summary>
    Task<bool> IsUserParticipantAsync(int conversationId, string userId);

    /// <summary>
    /// Get unread message count for user
    /// </summary>
    Task<int> GetUnreadCountAsync(string userId);

    /// <summary>
    /// Get other participant in conversation
    /// </summary>
    Task<string?> GetOtherParticipantIdAsync(int conversationId, string currentUserId);
}