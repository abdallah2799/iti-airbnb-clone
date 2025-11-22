using Application.DTOs.HostBookings;

namespace Application.Services.Interfaces
{
    public interface IHostBookingService
    {
        // Get all reservations for this host
        Task<IEnumerable<HostBookingDto>> GetHostReservationsAsync(string hostId);
        Task<HostBookingDto?> GetBookingByIdAsync(int bookingId, string hostId);
        // Approve/Reject bookings (for non-instant book)
        Task<bool> ApproveBookingAsync(int bookingId, string hostId);
        Task<bool> RejectBookingAsync(int bookingId, string hostId);
    }
}