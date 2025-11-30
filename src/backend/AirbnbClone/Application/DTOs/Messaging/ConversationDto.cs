// File: Application/DTOs/Messaging/ConversationDto.cs
namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for conversation summary in list view
/// </summary>
public class ConversationDto
{
    public int Id { get; set; }

    // Participant Information
    public string GuestId { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? GuestProfilePicture { get; set; }

    public string HostId { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;
    public string? HostProfilePicture { get; set; }

    // Listing Information
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public string? ListingCoverPhoto { get; set; }

    // Last Message Preview
    public string? LastMessageContent { get; set; }
    public DateTime? LastMessageTimestamp { get; set; }
    public string? LastMessageSenderId { get; set; }

    // Unread Count
    public int UnreadCount { get; set; }
}

