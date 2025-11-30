// File: Application/DTOs/Messaging/ConversationListingDto.cs
namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for listing information in conversation
/// </summary>
public class ConversationListingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? CoverPhotoUrl { get; set; }
    public decimal PricePerNight { get; set; }
}

