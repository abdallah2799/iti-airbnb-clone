using System;

namespace Application.DTOs.Admin;

public class AdminReviewDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string AuthorName { get; set; } = "Anonymous";
    public string AuthorId { get; set; } = string.Empty;
    public string ListingTitle { get; set; } = "Unknown Listing";
    public DateTime DatePosted { get; set; }
}
