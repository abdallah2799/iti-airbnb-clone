// File: Application/DTOs/Messaging/CreateConversationDto.cs
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for creating a new conversation
/// </summary>
public class CreateConversationDto
{
    [Required(ErrorMessage = "Host ID is required")]
    public string HostId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Listing ID is required")]
    public int ListingId { get; set; }

    [MaxLength(2000, ErrorMessage = "Initial message cannot exceed 2000 characters")]
    public string? InitialMessage { get; set; }
}