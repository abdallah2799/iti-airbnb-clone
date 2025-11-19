using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Hubs;

/// <summary>
/// SignalR Hub for real-time messaging (Sprint 3)
/// Story: [M] Send & Receive Messages in Real-Time
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IMessagingService _messagingService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(
        IMessagingService messagingService,
        ILogger<ChatHub> logger)
    {
        _messagingService = messagingService;
        _logger = logger;
    }

    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time
    /// Called by client to send a message to a conversation
    /// </summary>
    public async Task SendMessage(int conversationId, string message)
    {
        try
        {
            // Get sender user ID from JWT claims
            var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(senderId))
            {
                _logger.LogWarning("Unauthorized message attempt - no user ID in claims");
                throw new HubException("User not authenticated");
            }

            _logger.LogInformation("User {SenderId} sending message to conversation {ConversationId}",
                senderId, conversationId);

            // Validate user is participant in this conversation
            if (!await _messagingService.IsUserParticipantAsync(conversationId, senderId))
            {
                _logger.LogWarning("User {SenderId} is not a participant in conversation {ConversationId}",
                    senderId, conversationId);
                throw new HubException("You are not a participant in this conversation");
            }

            // Save message to database
            var savedMessage = await _messagingService.SendMessageAsync(conversationId, senderId, message);

            // Broadcast message to all clients in the conversation group
            await Clients.Group($"conversation_{conversationId}")
                .SendAsync("ReceiveMessage", new
                {
                    savedMessage.Id,
                    savedMessage.ConversationId,
                    savedMessage.SenderId,
                    savedMessage.SenderName,
                    savedMessage.SenderProfilePicture,
                    savedMessage.Content,
                    savedMessage.Timestamp,
                    savedMessage.IsRead
                });

            // Get the other participant's ID
            var otherParticipantId = await _messagingService.GetOtherParticipantIdAsync(conversationId, senderId);

            if (!string.IsNullOrEmpty(otherParticipantId))
            {
                // Send notification to other participant if they're online
                await Clients.User(otherParticipantId)
                    .SendAsync("NewMessageNotification", new
                    {
                        conversationId,
                        savedMessage.SenderName,
                        preview = savedMessage.Content.Length > 50
                            ? savedMessage.Content.Substring(0, 50) + "..."
                            : savedMessage.Content
                    });
            }

            _logger.LogInformation("Message {MessageId} sent successfully in conversation {ConversationId}",
                savedMessage.Id, conversationId);
        }
        catch (HubException)
        {
            throw; // Re-throw HubExceptions to be handled by SignalR
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message in conversation {ConversationId}", conversationId);
            throw new HubException("Failed to send message. Please try again.");
        }
    }

    /// <summary>
    /// Client joins a conversation room to receive real-time messages
    /// </summary>
    public async Task JoinConversation(int conversationId)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized join attempt - no user ID in claims");
                throw new HubException("User not authenticated");
            }

            _logger.LogInformation("User {UserId} attempting to join conversation {ConversationId}",
                userId, conversationId);

            // Verify user is participant in this conversation
            if (!await _messagingService.IsUserParticipantAsync(conversationId, userId))
            {
                _logger.LogWarning("User {UserId} is not a participant in conversation {ConversationId}",
                    userId, conversationId);
                throw new HubException("You are not a participant in this conversation");
            }

            // Add connection to SignalR group for this conversation
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");

            _logger.LogInformation("User {UserId} joined conversation {ConversationId} successfully",
                userId, conversationId);

            // Notify other participants that user is online (optional)
            var otherParticipantId = await _messagingService.GetOtherParticipantIdAsync(conversationId, userId);
            if (!string.IsNullOrEmpty(otherParticipantId))
            {
                await Clients.User(otherParticipantId)
                    .SendAsync("UserJoined", new { conversationId, userId });
            }
        }
        catch (HubException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining conversation {ConversationId}", conversationId);
            throw new HubException("Failed to join conversation. Please try again.");
        }
    }

    /// <summary>
    /// Client leaves a conversation room
    /// </summary>
    public async Task LeaveConversation(int conversationId)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return;
            }

            _logger.LogInformation("User {UserId} leaving conversation {ConversationId}",
                userId, conversationId);

            // Remove connection from SignalR group
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");

            // Notify other participants that user left (optional)
            var otherParticipantId = await _messagingService.GetOtherParticipantIdAsync(conversationId, userId);
            if (!string.IsNullOrEmpty(otherParticipantId))
            {
                await Clients.User(otherParticipantId)
                    .SendAsync("UserLeft", new { conversationId, userId });
            }

            _logger.LogInformation("User {UserId} left conversation {ConversationId}",
                userId, conversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving conversation {ConversationId}", conversationId);
        }
    }

    /// <summary>
    /// User starts typing indicator (optional feature)
    /// </summary>
    public async Task UserTyping(int conversationId)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return;
            }

            // Verify user is participant
            if (!await _messagingService.IsUserParticipantAsync(conversationId, userId))
            {
                return;
            }

            // Broadcast to other users in the conversation (not to sender)
            await Clients.OthersInGroup($"conversation_{conversationId}")
                .SendAsync("UserTyping", new { conversationId, userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting typing indicator");
        }
    }

    /// <summary>
    /// User stops typing indicator (optional feature)
    /// </summary>
    public async Task UserStoppedTyping(int conversationId)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return;
            }

            // Verify user is participant
            if (!await _messagingService.IsUserParticipantAsync(conversationId, userId))
            {
                return;
            }

            // Broadcast to other users in the conversation (not to sender)
            await Clients.OthersInGroup($"conversation_{conversationId}")
                .SendAsync("UserStoppedTyping", new { conversationId, userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting stopped typing indicator");
        }
    }

    /// <summary>
    /// Mark messages as read via SignalR
    /// </summary>
    public async Task MarkMessagesAsRead(List<int> messageIds)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            await _messagingService.MarkMessagesAsReadAsync(messageIds, userId);

            _logger.LogInformation("Marked {Count} messages as read for user {UserId}",
                messageIds.Count, userId);

            // Optionally notify sender that messages were read
            // This would require getting the conversation ID and notifying the other participant
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read");
            throw new HubException("Failed to mark messages as read");
        }
    }

    /// <summary>
    /// Called when client connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

            _logger.LogInformation("User {UserId} ({UserName}) connected to ChatHub with connection ID: {ConnectionId}",
                userId ?? "Unknown", userName ?? "Unknown", Context.ConnectionId);

            // Add user to their personal group (for direct notifications)
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnConnectedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error on client connection");
        }
    }

    /// <summary>
    /// Called when client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (exception != null)
            {
                _logger.LogWarning(exception, "User {UserId} disconnected with error. Connection ID: {ConnectionId}",
                    userId ?? "Unknown", Context.ConnectionId);
            }
            else
            {
                _logger.LogInformation("User {UserId} disconnected normally. Connection ID: {ConnectionId}",
                    userId ?? "Unknown", Context.ConnectionId);
            }

            // Remove from personal group
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error on client disconnection");
        }
    }
}