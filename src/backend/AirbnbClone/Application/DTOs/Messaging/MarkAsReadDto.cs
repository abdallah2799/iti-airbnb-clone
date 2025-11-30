// File: Application/DTOs/Messaging/MarkAsReadDto.cs
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for marking messages as read
/// </summary>
public class MarkAsReadDto
{
    [Required(ErrorMessage = "Message IDs are required")]
    [MinLength(1, ErrorMessage = "At least one message ID is required")]
    public List<int> MessageIds { get; set; } = new();
}

