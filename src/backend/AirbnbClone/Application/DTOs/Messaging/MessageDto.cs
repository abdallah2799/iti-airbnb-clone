// File: Application/DTOs/Messaging/MessageDto.cs
namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for individual message
/// </summary>
public class MessageDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }

    // Sender Information
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string? SenderProfilePicture { get; set; }

    // Conversation Reference
    public int ConversationId { get; set; }
}

