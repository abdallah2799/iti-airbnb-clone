// File: Application/DTOs/Listing/HostInfoDto.cs
namespace Application.DTOs.Listing;

public class HostInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? Bio { get; set; }

    // Host metrics
    public decimal? ResponseRate { get; set; }
    public int? ResponseTimeMinutes { get; set; }
    public DateTime? HostSince { get; set; }
    public bool GovernmentIdVerified { get; set; }
}

