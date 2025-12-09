using Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class AdminListingDto
{
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be positive")]
    public decimal PricePerNight { get; set; }

    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    public ListingStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Host info
    public string HostId { get; set; } = string.Empty;
    public string HostFullName { get; set; } = string.Empty;
    public string HostEmail { get; set; } = string.Empty;

    public List<string> ImageUrls { get; set; } = new();
}

