using Application.DTOs.Messaging;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services.Implementation;

/// <summary>
/// Messaging service implementation (Sprint 3)
/// Handles conversation and message operations
/// </summary>
public class MessagingService : IMessagingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<MessagingService> _logger;

    public MessagingService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<MessagingService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Story: [M] Contact Host from Listing
    /// Create or get conversation between guest and host for a listing
    /// </summary>
    public async Task<ConversationDto> CreateOrGetConversationAsync(
        string guestId,
        string hostId,
        int listingId,
        string? initialMessage = null)
    {
        try
        {
            _logger.LogInformation("Creating/getting conversation between guest {GuestId} and host {HostId} for listing {ListingId}",
                guestId, hostId, listingId);

            // Validate listing exists and belongs to host
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null)
            {
                _logger.LogWarning("Listing {ListingId} not found", listingId);
                throw new ArgumentException("Listing not found");
            }

            if (listing.HostId != hostId)
            {
                _logger.LogWarning("Listing {ListingId} does not belong to host {HostId}", listingId, hostId);
                throw new ArgumentException("Listing does not belong to specified host");
            }

            // Check if conversation already exists
            var existingConversation = await _unitOfWork.Conversations
                .GetConversationBetweenUsersAsync(guestId, hostId, listingId);

            if (existingConversation != null)
            {
                _logger.LogInformation("Existing conversation found: {ConversationId}", existingConversation.Id);

                // Send initial message if provided
                if (!string.IsNullOrWhiteSpace(initialMessage))
                {
                    await SendMessageAsync(existingConversation.Id, guestId, initialMessage);
                }

                return await MapConversationToDto(existingConversation);
            }

            // Create new conversation
            var conversation = new Conversation
            {
                GuestId = guestId,
                HostId = hostId,
                ListingId = listingId
            };

            await _unitOfWork.Conversations.AddAsync(conversation);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("New conversation created: {ConversationId}", conversation.Id);

            // Send initial message if provided
            if (!string.IsNullOrWhiteSpace(initialMessage))
            {
                await SendMessageAsync(conversation.Id, guestId, initialMessage);
            }

            // Reload conversation with related entities
            var createdConversation = await _unitOfWork.Conversations
                .GetConversationWithParticipantsAsync(conversation.Id);

            return await MapConversationToDto(createdConversation!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/getting conversation");
            throw;
        }
    }

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// Get all conversations for a user
    /// </summary>
    public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId)
    {
        try
        {
            _logger.LogInformation("Fetching conversations for user {UserId}", userId);

            var conversations = await _unitOfWork.Conversations.GetUserConversationsAsync(userId);

            var conversationDtos = new List<ConversationDto>();

            foreach (var conversation in conversations)
            {
                var dto = await MapConversationToDto(conversation);

                // Calculate unread count for current user
                dto.UnreadCount = conversation.Messages
                    .Count(m => !m.IsRead && m.SenderId != userId);

                conversationDtos.Add(dto);
            }

            // Sort by last message timestamp (most recent first)
            var sortedConversations = conversationDtos
                .OrderByDescending(c => c.LastMessageTimestamp ?? DateTime.MinValue)
                .ToList();

            _logger.LogInformation("Found {Count} conversations for user {UserId}", sortedConversations.Count, userId);

            return sortedConversations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user conversations");
            throw;
        }
    }

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// Get all messages in a conversation
    /// </summary>
    public async Task<ConversationDetailDto?> GetConversationMessagesAsync(int conversationId, string userId)
    {
        try
        {
            _logger.LogInformation("Fetching messages for conversation {ConversationId}", conversationId);

            // Verify user is participant
            if (!await IsUserParticipantAsync(conversationId, userId))
            {
                _logger.LogWarning("User {UserId} is not a participant in conversation {ConversationId}",
                    userId, conversationId);
                return null;
            }

            var conversation = await _unitOfWork.Conversations
                .GetConversationWithMessagesAsync(conversationId);

            if (conversation == null)
            {
                _logger.LogWarning("Conversation {ConversationId} not found", conversationId);
                return null;
            }

            var dto = _mapper.Map<ConversationDetailDto>(conversation);

            _logger.LogInformation("Found {Count} messages in conversation {ConversationId}",
                dto.Messages.Count, conversationId);

            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching conversation messages");
            throw;
        }
    }

    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time
    /// Send a message in a conversation
    /// </summary>
    public async Task<MessageDto> SendMessageAsync(int conversationId, string senderId, string content)
    {
        try
        {
            _logger.LogInformation("Sending message in conversation {ConversationId} from user {SenderId}",
                conversationId, senderId);

            // Verify conversation exists and user is participant
            var conversation = await _unitOfWork.Conversations.GetByIdAsync(conversationId);
            if (conversation == null)
            {
                _logger.LogWarning("Conversation {ConversationId} not found", conversationId);
                throw new ArgumentException("Conversation not found");
            }

            if (!await IsUserParticipantAsync(conversationId, senderId))
            {
                _logger.LogWarning("User {SenderId} is not a participant in conversation {ConversationId}",
                    senderId, conversationId);
                throw new UnauthorizedAccessException("User is not a participant in this conversation");
            }

            // Create message
            var message = new Message
            {
                ConversationId = conversationId,
                SenderId = senderId,
                Content = content.Trim(),
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            await _unitOfWork.Messages.AddAsync(message);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Message {MessageId} sent successfully", message.Id);

            // Reload message with sender information
            var messages = await _unitOfWork.Messages.GetConversationMessagesAsync(conversationId);
            var sentMessage = messages.FirstOrDefault(m => m.Id == message.Id);

            return _mapper.Map<MessageDto>(sentMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            throw;
        }
    }

    /// <summary>
    /// Mark messages as read
    /// </summary>
    public async Task MarkMessagesAsReadAsync(List<int> messageIds, string userId)
    {
        try
        {
            _logger.LogInformation("Marking {Count} messages as read for user {UserId}",
                messageIds.Count, userId);

            await _unitOfWork.Messages.MarkMessagesAsReadAsync(messageIds);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Messages marked as read successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read");
            throw;
        }
    }

    /// <summary>
    /// Check if user is participant in conversation
    /// </summary>
    public async Task<bool> IsUserParticipantAsync(int conversationId, string userId)
    {
        var conversation = await _unitOfWork.Conversations.GetByIdAsync(conversationId);
        return conversation != null && (conversation.GuestId == userId || conversation.HostId == userId);
    }

    /// <summary>
    /// Get unread message count for user
    /// </summary>
    public async Task<int> GetUnreadCountAsync(string userId)
    {
        try
        {
            var unreadMessages = await _unitOfWork.Messages.GetUnreadMessagesAsync(userId);
            return unreadMessages.Count();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            throw;
        }
    }

    /// <summary>
    /// Get other participant in conversation
    /// </summary>
    public async Task<string?> GetOtherParticipantIdAsync(int conversationId, string currentUserId)
    {
        var conversation = await _unitOfWork.Conversations.GetByIdAsync(conversationId);
        if (conversation == null)
            return null;

        return conversation.GuestId == currentUserId ? conversation.HostId : conversation.GuestId;
    }

    // Helper method to map conversation to DTO
    private async Task<ConversationDto> MapConversationToDto(Conversation conversation)
    {
        // Load related entities if not already loaded
        if (conversation.Guest == null || conversation.Host == null || conversation.Listing == null)
        {
            conversation = (await _unitOfWork.Conversations
                .GetConversationWithParticipantsAsync(conversation.Id))!;
        }

        var dto = _mapper.Map<ConversationDto>(conversation);

        // Get last message
        var messages = await _unitOfWork.Messages.GetConversationMessagesAsync(conversation.Id);
        var lastMessage = messages.OrderByDescending(m => m.Timestamp).FirstOrDefault();

        if (lastMessage != null)
        {
            dto.LastMessageContent = lastMessage.Content.Length > 100
                ? lastMessage.Content.Substring(0, 100) + "..."
                : lastMessage.Content;
            dto.LastMessageTimestamp = lastMessage.Timestamp;
            dto.LastMessageSenderId = lastMessage.SenderId;
        }

        return dto;
    }
}

