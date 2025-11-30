using Core.Enums;

namespace Application.DTOs.HostBookings
{
    public class HostBookingDto
    {
        public int Id { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Guests { get; set; }
        public decimal TotalPrice { get; set; }
        public BookingStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        // Information about the guest who booked
        public GuestDto Guest { get; set; } = null!;

        // Which listing was booked
        public string ListingTitle { get; set; } = string.Empty;
        public int ListingId { get; set; }
        public string? ListingImageUrl { get; set; }
    }

    public class GuestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public DateTime CreatedAt { get; set; } // "Member since..."
    }
}

