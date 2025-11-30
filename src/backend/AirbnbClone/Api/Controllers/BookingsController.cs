using Application.DTOs.Bookings;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manages guest booking operations (create, read, update, cancel)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(
        IBookingService bookingService,
        ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new booking (guest). Returns the created booking summary (Pending).
    /// </summary>
    /// <param name="request">Booking creation payload</param>
    /// <returns>Created booking summary</returns>
    /// <response code="201">Booking created successfully</response>
    /// <response code="400">Invalid request</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User attempted to book own listing</response>
    /// <response code="409">Listing not available for selected dates</response>
    /// <response code="500">Internal server error</response>
    [HttpPost]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "User not authenticated" });

        try
        {
            var booking = await _bookingService.CreateBookingAsync(request, userId);
            return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, booking);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid booking request");
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized booking attempt");
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Booking conflict / business rule");
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return StatusCode(500, new { message = "An error occurred while creating booking" });
        }
    }

    /// <summary>
    /// Retrieves all bookings for the authenticated guest
    /// </summary>
    /// <returns>List of guest bookings</returns>
    /// <response code="200">Bookings retrieved successfully</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="500">Internal server error</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetGuestBookings()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "User not authenticated" });

        try
        {
            var bookings = await _bookingService.GetGuestBookingsAsync(userId);
            return Ok(bookings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving guest bookings");
            return StatusCode(500, new { message = "An error occurred while retrieving bookings" });
        }
    }

    /// <summary>
    /// Retrieves detailed booking information (guest must own booking)
    /// </summary>
    /// <param name="id">Booking id</param>
    /// <returns>Booking details</returns>
    /// <response code="200">Booking retrieved successfully</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">Access denied to booking</response>
    /// <response code="404">Booking not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BookingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetBookingById(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "User not authenticated" });

        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id, userId);
            if (booking == null) return NotFound(new { message = "Booking not found" });
            return Ok(booking);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to booking {BookingId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving booking details" });
        }
    }

    /// <summary>
    /// Update an existing booking (guest). Only limited updates allowed while booking is Pending.
    /// </summary>
    /// <param name="id">Booking id</param>
    /// <param name="request">Update payload</param>
    /// <returns>Updated booking summary</returns>
    /// <response code="200">Booking updated successfully</response>
    /// <response code="400">Invalid request</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">Access denied</response>
    /// <response code="404">Booking not found</response>
    /// <response code="422">Update not allowed</response>
    /// <response code="500">Internal server error</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateBooking(int id, [FromBody] UpdateBookingRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "User not authenticated" });

        try
        {
            var updated = await _bookingService.UpdateBookingAsync(id, request, userId);
            if (updated == null) return NotFound(new { message = "Booking not found" });
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for booking {BookingId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid update for booking {BookingId}", id);
            return UnprocessableEntity(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred while updating booking" });
        }
    }

    /// <summary>
    /// Cancel a booking (guest). Marks booking as Cancelled.
    /// </summary>
    /// <param name="id">Booking id</param>
    /// <param name="reason">Optional cancellation reason</param>
    /// <response code="200">Booking cancelled successfully</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">Access denied</response>
    /// <response code="404">Booking not found</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CancelBooking(int id, [FromQuery] string? reason = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "User not authenticated" });

        try
        {
            await _bookingService.CancelBookingAsync(id, userId, reason);
            return Ok(new { success = true, message = "Booking cancelled" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Cancel attempted for non-existing booking {BookingId}", id);
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized cancellation attempt for booking {BookingId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred while cancelling booking" });
        }
    }
}
