using Application.DTOs.HostBookings;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories; // or Application.Interfaces

namespace Application.Services.Implementation
{
    public class HostBookingService : IHostBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public HostBookingService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<HostBookingDto>> GetHostReservationsAsync(string hostId)
        {
            // The repository already has this method implemented!
            var bookings = await _unitOfWork.Bookings.GetHostReservationsAsync(hostId);

            // Use AutoMapper to convert to DTOs
            return _mapper.Map<IEnumerable<HostBookingDto>>(bookings);
        }

        public async Task<bool> ApproveBookingAsync(int bookingId, string hostId)
        {
            // 1. Get booking with listing details to check ownership
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

            if (booking == null) throw new KeyNotFoundException("Booking not found");

            // 2. Verify Host owns the listing
            if (booking.Listing.HostId != hostId)
                throw new UnauthorizedAccessException("You do not own this booking.");

            // 3. Only Pending bookings can be approved
            if (booking.Status != BookingStatus.Pending)
                throw new InvalidOperationException($"Cannot approve booking with status {booking.Status}");

            // 4. Update Status
            booking.Status = BookingStatus.Confirmed;
           // booking.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<bool> RejectBookingAsync(int bookingId, string hostId)
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

            if (booking == null) throw new KeyNotFoundException("Booking not found");

            if (booking.Listing.HostId != hostId)
                throw new UnauthorizedAccessException("You do not own this booking.");

            if (booking.Status != BookingStatus.Pending)
                throw new InvalidOperationException($"Cannot reject booking with status {booking.Status}");

            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;

            // Logic for refunding if payment was already made would go here

            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<HostBookingDto?> GetBookingByIdAsync(int bookingId, string hostId)
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

            if (booking == null) return null;

            if (booking.Listing.HostId != hostId)
            {
                throw new UnauthorizedAccessException("You do not own this booking.");
            }

            return _mapper.Map<HostBookingDto>(booking);
        }
    }
}