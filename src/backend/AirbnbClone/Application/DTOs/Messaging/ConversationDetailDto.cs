// File: Application/DTOs/Messaging/ConversationDetailDto.cs
namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for detailed conversation view with messages
/// </summary>
public class ConversationDetailDto
{
    public int Id { get; set; }

    // Participants
    public ParticipantDto Guest { get; set; } = new();
    public ParticipantDto Host { get; set; } = new();

    // Listing
    public ConversationListingDto Listing { get; set; } = new();

    // Messages
    public List<MessageDto> Messages { get; set; } = new();
}