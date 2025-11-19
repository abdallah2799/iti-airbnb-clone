// File: Application/DTOs/Messaging/SendMessageDto.cs
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for sending a message
/// </summary>
public class SendMessageDto
{
    [Required(ErrorMessage = "Conversation ID is required")]
    public int ConversationId { get; set; }

    [Required(ErrorMessage = "Message content is required")]
    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string Content { get; set; } = string.Empty;
}