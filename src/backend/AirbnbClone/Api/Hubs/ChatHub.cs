using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

/// <summary>
/// SignalR Hub for real-time messaging (Sprint 3)
/// Story: [M] Send & Receive Messages in Real-Time
/// </summary>
[Authorize] // Require authentication for SignalR connections
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    // TODO: Inject IMessagingService to save messages to database

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Story: [M] Send & Receive Messages in Real-Time
    /// Called by client to send a message to a conversation
    /// </summary>
    /// <param name="conversationId">Conversation ID</param>
    /// <param name="message">Message content</param>
    public async Task SendMessage(string conversationId, string message)
    {
        // TODO: Sprint 3 - Story 2: Send & Receive Messages in Real-Time
        // 1. Get sender user ID from Context.User claims
        // 2. Validate user is participant in this conversation
        // 3. Save message to database via IMessagingService
        // 4. Broadcast message to all clients in the conversation group
        //    await Clients.Group(conversationId).SendAsync("ReceiveMessage", messageDto);
        // 5. Send notification to other participant if they're online
        
        _logger.LogInformation($"User attempting to send message to conversation {conversationId}");
        throw new NotImplementedException("Sprint 3 - Story 2: SendMessage - To be implemented");
    }

    /// <summary>
    /// Client joins a conversation room to receive real-time messages
    /// </summary>
    /// <param name="conversationId">Conversation ID to join</param>
    public async Task JoinConversation(string conversationId)
    {
        // TODO: Sprint 3 - Join conversation group
        // 1. Get user ID from Context.User
        // 2. Verify user is participant in this conversation
        // 3. Add connection to SignalR group: await Groups.AddToGroupAsync(Context.ConnectionId, conversationId)
        // 4. Notify other participants user is online (optional)
        
        _logger.LogInformation($"User attempting to join conversation {conversationId}");
        throw new NotImplementedException("Sprint 3 - JoinConversation - To be implemented");
    }

    /// <summary>
    /// Client leaves a conversation room
    /// </summary>
    /// <param name="conversationId">Conversation ID to leave</param>
    public async Task LeaveConversation(string conversationId)
    {
        // TODO: Sprint 3 - Leave conversation group
        // 1. Remove connection from SignalR group: await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId)
        // 2. Notify other participants user is offline (optional)
        
        _logger.LogInformation($"User leaving conversation {conversationId}");
        throw new NotImplementedException("Sprint 3 - LeaveConversation - To be implemented");
    }

    /// <summary>
    /// User starts typing indicator (optional feature)
    /// </summary>
    public async Task UserTyping(string conversationId)
    {
        // TODO: Sprint 3 - Optional: Typing indicator
        // Broadcast to group that user is typing
        // await Clients.OthersInGroup(conversationId).SendAsync("UserTyping", userId);
        
        throw new NotImplementedException("Sprint 3 - UserTyping - To be implemented");
    }

    /// <summary>
    /// Called when client connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        // TODO: Sprint 3 - Handle user connection
        // 1. Get user ID from Context.User
        // 2. Log connection
        // 3. Optionally update user's online status
        
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // TODO: Sprint 3 - Handle user disconnection
        // 1. Get user ID
        // 2. Log disconnection
        // 3. Remove from all groups
        // 4. Update user's online status
        
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
}
