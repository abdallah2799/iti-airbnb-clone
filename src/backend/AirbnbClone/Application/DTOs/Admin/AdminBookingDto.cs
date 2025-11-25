using Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class AdminBookingDto
{
    public int Id { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    [Range(1, int.MaxValue)]
    public int Guests { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal TotalPrice { get; set; }

    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Guest
    public string GuestId { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public string GuestFullName { get; set; } = string.Empty;

    // Listing
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;

    // Host
    public string HostId { get; set; } = string.Empty;
    public string HostEmail { get; set; } = string.Empty;
    public string HostFullName { get; set; } = string.Empty;
}