// File: Application/DTOs/Listing/ReviewSummaryDto.cs
namespace Application.DTOs.Listing;

public class ReviewSummaryDto
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime DatePosted { get; set; }

    // Guest info
    public string GuestName { get; set; } = string.Empty;
    public string? GuestProfilePicture { get; set; }
}

