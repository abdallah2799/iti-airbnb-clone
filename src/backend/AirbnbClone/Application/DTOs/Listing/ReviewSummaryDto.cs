// File: Application/DTOs/Listing/ReviewSummaryDto.cs
namespace Application.DTOs.Listing;

using Application.DTOs;

public class ReviewSummaryDto
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime DatePosted { get; set; }

    // Guest info
    public GuestDto Guest { get; set; } = new();
}

