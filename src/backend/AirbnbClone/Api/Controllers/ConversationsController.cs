using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Conversations controller for Sprint 3
/// Handles creating conversations and retrieving conversation history
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // All messaging endpoints require authentication
public class ConversationsController : ControllerBase
{
    private readonly IMessagingService _messagingService;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(
        IMessagingService messagingService,
        ILogger<ConversationsController> logger)
    {
        _messagingService = messagingService;
        _logger = logger;
    }

    /// <summary>
    /// Story: [M] Contact Host from Listing
    /// POST api/conversations
    /// Create or get conversation between guest and host for a listing
    /// </summary>
    /// <param name="request">Request containing hostId and listingId</param>
    /// <returns>Conversation ID and basic info</returns>
    [HttpPost]
    public async Task<IActionResult> CreateOrGetConversation([FromBody] object request)
    {
        // TODO: Sprint 3 - Story 1: Contact Host from Listing
        // 1. Get current user (guest) ID from JWT claims
        // 2. Extract hostId and listingId from request
        // 3. Validate that listing exists and hostId matches listing owner
        // 4. Call _messagingService.CreateOrGetConversationAsync(guestId, hostId, listingId)
        // 5. If conversation exists, return existing conversation
        // 6. If new conversation created, return new conversation ID
        // 7. Return conversation with participants info
        
        throw new NotImplementedException("Sprint 3 - Story 1: Contact Host from Listing - To be implemented");
    }

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// GET api/conversations
    /// Get all conversations for current user
    /// </summary>
    /// <returns>List of conversations with last message preview</returns>
    [HttpGet]
    public async Task<IActionResult> GetUserConversations()
    {
        // TODO: Sprint 3 - Story 3: View Past Conversation History
        // 1. Get current user ID from JWT claims
        // 2. Call _messagingService.GetUserConversationsAsync(userId)
        // 3. Return list of conversations sorted by last message timestamp
        // 4. Include: other participant info, listing info, last message preview
        
        throw new NotImplementedException("Sprint 3 - Story 3: View Past Conversation History - To be implemented");
    }

    /// <summary>
    /// Story: [M] View Past Conversation History
    /// GET api/conversations/{conversationId}/messages
    /// Get all messages in a conversation
    /// </summary>
    /// <param name="conversationId">Conversation ID</param>
    /// <returns>List of messages ordered by timestamp</returns>
    [HttpGet("{conversationId}/messages")]
    public async Task<IActionResult> GetConversationMessages(int conversationId)
    {
        // TODO: Sprint 3 - Story 3: View Past Conversation History (Messages)
        // 1. Get current user ID from JWT claims
        // 2. Verify user is participant in this conversation
        // 3. Call _messagingService.GetConversationMessagesAsync(conversationId)
        // 4. Return all messages with sender info, ordered by timestamp
        // 5. If user not authorized, return 403 Forbidden
        
        throw new NotImplementedException("Sprint 3 - Story 3: Get Conversation Messages - To be implemented");
    }

    /// <summary>
    /// POST api/conversations/{conversationId}/messages
    /// Send a message in a conversation (non-realtime fallback)
    /// Note: Real-time sending should use SignalR hub
    /// </summary>
    /// <param name="conversationId">Conversation ID</param>
    /// <param name="request">Message content</param>
    /// <returns>Created message</returns>
    [HttpPost("{conversationId}/messages")]
    public async Task<IActionResult> SendMessage(int conversationId, [FromBody] object request)
    {
        // TODO: Sprint 3 - Send Message (HTTP fallback)
        // This is a fallback for sending messages via HTTP instead of SignalR
        // 1. Get current user ID from JWT claims
        // 2. Verify user is participant in conversation
        // 3. Extract message content from request
        // 4. Call _messagingService.SendMessageAsync(conversationId, userId, content)
        // 5. Return created message
        // Note: For real-time, use ChatHub instead
        
        throw new NotImplementedException("Sprint 3 - Send Message (HTTP) - To be implemented");
    }

    /// <summary>
    /// PUT api/conversations/messages/read
    /// Mark messages as read
    /// </summary>
    /// <param name="request">List of message IDs</param>
    /// <returns>Success</returns>
    [HttpPut("messages/read")]
    public async Task<IActionResult> MarkAsRead([FromBody] object request)
    {
        // TODO: Sprint 3 - Mark messages as read
        // 1. Get current user ID from JWT claims
        // 2. Extract list of message IDs from request
        // 3. Call _messagingService.MarkAsReadAsync(messageIds, userId)
        // 4. Return 200 OK
        
        throw new NotImplementedException("Sprint 3 - Mark Messages as Read - To be implemented");
    }
}
