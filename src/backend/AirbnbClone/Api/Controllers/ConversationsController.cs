using Application.DTOs.Messaging;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manages messaging conversations between guests and hosts
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
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
    /// Creates a new conversation or retrieves an existing one between guest and host
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ConversationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ConversationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateOrGetConversation([FromBody] CreateConversationDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Get current user (guest) from JWT token
            var guestId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(guestId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Prevent user from messaging themselves
            if (guestId == request.HostId)
            {
                return BadRequest(new { message = "Cannot create conversation with yourself" });
            }

            var conversation = await _messagingService.CreateOrGetConversationAsync(
                guestId,
                request.HostId,
                request.ListingId,
                request.InitialMessage);

            _logger.LogInformation("Conversation created/retrieved: {ConversationId} between guest {GuestId} and host {HostId}",
                conversation.Id, guestId, request.HostId);

            // Return 201 if new conversation, 200 if existing
            var isNewConversation = !string.IsNullOrWhiteSpace(request.InitialMessage);

            if (isNewConversation)
            {
                return CreatedAtAction(
                    nameof(GetConversationMessages),
                    new { conversationId = conversation.Id },
                    conversation);
            }

            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for creating conversation");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/getting conversation");
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Retrieves all conversations for the authenticated user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ConversationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserConversations()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var conversations = await _messagingService.GetUserConversationsAsync(userId);

            _logger.LogInformation("Retrieved {Count} conversations for user {UserId}",
                conversations.Count(), userId);

            return Ok(conversations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user conversations");
            return StatusCode(500, new { message = "An error occurred while retrieving conversations" });
        }
    }

    /// <summary>
    /// Retrieves all messages in a specific conversation
    /// </summary>
    [HttpGet("{conversationId}/messages")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetConversationMessages(int conversationId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Verify user is participant
            if (!await _messagingService.IsUserParticipantAsync(conversationId, userId))
            {
                _logger.LogWarning("User {UserId} attempted to access conversation {ConversationId} without permission",
                    userId, conversationId);
                return Forbid();
            }

            var conversation = await _messagingService.GetConversationMessagesAsync(conversationId, userId);

            if (conversation == null)
            {
                return NotFound(new { message = "Conversation not found" });
            }

            _logger.LogInformation("Retrieved {Count} messages for conversation {ConversationId}",
                conversation.Messages.Count, conversationId);

            return Ok(conversation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversation messages for conversation {ConversationId}",
                conversationId);
            return StatusCode(500, new { message = "An error occurred while retrieving messages" });
        }
    }

    /// <summary>
    /// Sends a message in a conversation via HTTP (fallback method)
    /// </summary>
    [HttpPost("{conversationId}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SendMessage(int conversationId, [FromBody] SendMessageDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate conversation ID matches
        if (conversationId != request.ConversationId)
        {
            return BadRequest(new { message = "Conversation ID mismatch" });
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Verify user is participant
            if (!await _messagingService.IsUserParticipantAsync(conversationId, userId))
            {
                _logger.LogWarning("User {UserId} attempted to send message to conversation {ConversationId} without permission",
                    userId, conversationId);
                return Forbid();
            }

            var message = await _messagingService.SendMessageAsync(conversationId, userId, request.Content);

            _logger.LogInformation("Message {MessageId} sent in conversation {ConversationId} by user {UserId}",
                message.Id, conversationId, userId);

            return CreatedAtAction(
                nameof(GetConversationMessages),
                new { conversationId },
                message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for sending message");
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized attempt to send message");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message in conversation {ConversationId}", conversationId);
            return StatusCode(500, new { message = "An error occurred while sending the message" });
        }
    }

    /// <summary>
    /// Marks specified messages as read by the authenticated user
    /// </summary>
    [HttpPut("messages/read")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> MarkAsRead([FromBody] MarkAsReadDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            await _messagingService.MarkMessagesAsReadAsync(request.MessageIds, userId);

            _logger.LogInformation("Marked {Count} messages as read for user {UserId}",
                request.MessageIds.Count, userId);

            return Ok(new { success = true, message = "Messages marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read");
            return StatusCode(500, new { message = "An error occurred while marking messages as read" });
        }
    }

    /// <summary>
    /// Gets the unread message count for the authenticated user
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var count = await _messagingService.GetUnreadCountAsync(userId);

            return Ok(new { unreadCount = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new { message = "An error occurred while getting unread count" });
        }
    }
}
