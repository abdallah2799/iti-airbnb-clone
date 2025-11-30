using Application.DTOs.HostBookings;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Host")]
    [Produces("application/json")]
    public class HostBookingsController : ControllerBase
    {
        private readonly IHostBookingService _bookingService;

        public HostBookingsController(IHostBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        /// <summary>
        /// Gets all reservations for the authenticated host's listings.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<HostBookingDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyReservations()
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            var bookings = await _bookingService.GetHostReservationsAsync(hostId);
            return Ok(bookings);
        }

        /// <summary>
        /// Approves a pending booking request.
        /// </summary>
        [HttpPost("{id}/approve")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _bookingService.ApproveBookingAsync(id, hostId);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }

        /// <summary>
        /// Rejects a pending booking request.
        /// </summary>
        [HttpPost("{id}/reject")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> RejectBooking(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _bookingService.RejectBookingAsync(id, hostId);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }


        /// <summary>
        /// Gets a specific reservation details.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(HostBookingDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetBookingById(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(id, hostId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found" });

                return Ok(booking);
            }
            catch (UnauthorizedAccessException)
            {
                // Return 403 if they try to access someone else's booking
                return Forbid();
            }
        }

    }



}
