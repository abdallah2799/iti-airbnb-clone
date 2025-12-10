using Application.DTOs;
using Application.DTOs.Admin;
using Application.Services.Interfaces;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Manages administrative operations for platform oversight.
/// </summary>
/// <remarks>
/// Provides SuperAdmin capabilities to manage users, listings, and bookings.
/// 
/// **Sprint 6 Focus**: Admin dashboard (manage users, listings, bookings)
/// 
/// **User Stories**:
/// - [A] As an Admin, I want to view all users and suspend/delete them if needed.
/// - [A] As an Admin, I want to approve, reject, suspend, or delete listings.
/// - [A] As an Admin, I want to view and cancel bookings.
/// 
/// **Security**:
/// - All endpoints require JWT authentication with "SuperAdmin" role
/// - Authorization enforced via [Authorize(Roles = "SuperAdmin")]
/// - Sensitive actions (delete, suspend) are logged via Serilog
/// 
/// **Implementation Notes**:
/// - Uses IAdminService for business logic
/// - All write operations call UnitOfWork.CompleteAsync() to persist changes
/// - Pagination supported via page/size query parameters (default: page=1, pageSize=10)
/// - Returns standardized PagedResult&lt;T&gt; for list endpoints
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IAdminService adminService,
        IUnitOfWork unitOfWork,
        ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    // ============= DASHBOARD =============

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var result = await _adminService.GetDashboardDataAsync();
        return Ok(result);
    }



    // ============= USERS =============

    /// <summary>
    /// Retrieves a paginated list of all users.
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10, max: 100)</param>
    /// <returns>Paginated list of users</returns>
    /// <response code="200">Returns paginated user list</response>
    /// <response code="401">Unauthorized (missing or invalid JWT)</response>
    /// <response code="403">Forbidden (user is not SuperAdmin)</response>
    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Min(pageSize, 100); // Prevent abuse
        var result = await _adminService.GetUsersAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves a specific user by ID.
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User details</returns>
    /// <response code="200">User found</response>
    /// <response code="404">User not found</response>
    [HttpGet("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> GetUser(string id)
    {
        var user = await _adminService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    /// <summary>
    /// Suspends a user account (soft delete).
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    /// <response code="200">User suspended successfully</response>
    /// <response code="400">Cannot suspend SuperAdmin</response>
    /// <response code="404">User not found</response>
    [HttpPatch("users/{id}/suspend")]
    public async Task<ActionResult> SuspendUser(string id)
    {
        var success = await _adminService.SuspendUserAsync(id);
        if (!success)
        {
            // Could be not found or is SuperAdmin
            var exists = await _adminService.GetUserByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "User not found" });
            return BadRequest(new { message = "Cannot suspend SuperAdmin account" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("User {UserId} suspended by admin", id);
        return Ok(new { message = "User suspended successfully" });
    }

    /// <summary>
    /// Unsuspends a user account (soft delete).
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns> 
    /// <response code="200">User unsuspended successfully</response>
    /// <response code="400">Cannot Unsuspend SuperAdmin</response>
    /// <response code="404">User not found</response>
    /// <remarks>
    /// This endpoint is used to undo the suspension of a user account.
    /// </remarks>
    
    [HttpPatch("users/{id}/Unsuspend")]
    public async Task<ActionResult> UnSuspendUser(string id)
    {
        var success = await _adminService.UnSuspendUserAsync(id);
        if (!success)
        {
            // Could be not found or is SuperAdmin
            var exists = await _adminService.GetUserByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "User not found" });
            return BadRequest(new { message = "Cannot Unsuspend SuperAdmin account" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("User {UserId} Unsuspended by admin", id);
        return Ok(new { message = "User Unsuspended successfully" });
    }



    /// <summary>
    /// Permanently deletes a user account.
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    /// <response code="204">User deleted successfully</response>
    /// <response code="400">Cannot delete SuperAdmin</response>
    /// <response code="404">User not found</response>
    [HttpDelete("users/{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        var success = await _adminService.DeleteUserAsync(id);
        if (!success)
        {
            var exists = await _adminService.GetUserByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "User not found" });
            return BadRequest(new { message = "Cannot delete SuperAdmin account" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("User {UserId} deleted by admin", id);
        return NoContent();
    }

    // ============= LISTINGS =============

    /// <summary>
    /// Retrieves a paginated list of all listings.
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10, max: 50)</param>
    /// <returns>Paginated list of listings</returns>
    [HttpGet("listings")]
    public async Task<ActionResult<PagedResult<AdminListingDto>>> GetListings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null)
    {
        pageSize = Math.Min(pageSize, 50);
        var result = await _adminService.GetListingsAsync(page, pageSize, status);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves a specific listing by ID.
    /// </summary>
    [HttpGet("listings/{id}")]
    public async Task<ActionResult<AdminListingDto>> GetListing(int id)
    {
        var listing = await _adminService.GetListingByIdAsync(id);
        if (listing == null)
            return NotFound(new { message = "Listing not found" });

        return Ok(listing);
    }

    /// <summary>
    /// Updates the status of a listing (e.g., Published, Suspended).
    /// </summary>
    /// <param name="id">Listing ID</param>
    /// <param name="dto">New status</param>
    /// <returns>Success status</returns>
    [HttpPatch("listings/{id}/status")]
    public async Task<ActionResult> UpdateListingStatus(int id, [FromBody] UpdateListingStatusDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var success = await _adminService.UpdateListingStatusAsync(id, dto.Status);
        if (!success)
            return NotFound(new { message = "Listing not found" });

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Listing {ListingId} status updated to {Status} by admin", id, dto.Status);
        return Ok(new { message = "Listing status updated successfully" });
    }

    /// <summary>
    /// Permanently deletes a listing.
    /// </summary>
    /// <param name="id">Listing ID</param>
    /// <returns>Success status</returns>
    [HttpDelete("listings/{id}")]
    public async Task<ActionResult> DeleteListing(int id)
    {
        var success = await _adminService.DeleteListingAsync(id);
        if (!success)
        {
            // Check if it's due to confirmed bookings or not found
            var exists = await _adminService.GetListingByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "Listing not found" });
            return BadRequest(new { message = "Cannot delete listing with confirmed bookings" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Listing {ListingId} deleted by admin", id);
        return NoContent();
    }

    // ============= BOOKINGS =============

    /// <summary>
    /// Retrieves a paginated list of all bookings.
    /// </summary>
    [HttpGet("bookings")]
    public async Task<ActionResult<PagedResult<AdminBookingDto>>> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Min(pageSize, 50);
        var result = await _adminService.GetBookingsAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves a specific booking by ID.
    /// </summary>
    [HttpGet("bookings/{id}")]
    public async Task<ActionResult<AdminBookingDto>> GetBooking(int id)
    {
        var booking = await _adminService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        return Ok(booking);
    }

    /// <summary>
    /// Updates the status of a booking.
    /// </summary>
    [HttpPatch("bookings/{id}/status")]
    public async Task<ActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var success = await _adminService.UpdateBookingStatusAsync(id, dto.Status);
        if (!success)
        {
            var exists = await _adminService.GetBookingByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "Booking not found" });
            return BadRequest(new { message = "Invalid booking status transition" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Booking {BookingId} status updated to {Status} by admin", id, dto.Status);
        return Ok(new { message = "Booking status updated successfully" });
    }

    /// <summary>
    /// Permanently deletes a booking.
    /// </summary>
    [HttpDelete("bookings/{id}")]
    public async Task<ActionResult> DeleteBooking(int id)
    {
        var success = await _adminService.DeleteBookingAsync(id);
        if (!success)
        {
            var exists = await _adminService.GetBookingByIdAsync(id);
            if (exists == null)
                return NotFound(new { message = "Booking not found" });
            return BadRequest(new { message = "Cannot delete confirmed booking" });
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Booking {BookingId} deleted by admin", id);
        return NoContent();
    }

    // ============= REVIEWS =============

    /// <summary>
    /// Retrieves a paginated list of all reviews.
    /// </summary>
    [HttpGet("reviews")]
    public async Task<ActionResult<PagedResult<AdminReviewDto>>> GetReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Min(pageSize, 50);
        var result = await _adminService.GetReviewsAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Permanently deletes a review.
    /// </summary>
    [HttpDelete("reviews/{id}")]
    public async Task<ActionResult> DeleteReview(int id)
    {
        var success = await _adminService.DeleteReviewAsync(id);
        if (!success)
            return NotFound(new { message = "Review not found" });

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Review {ReviewId} deleted by admin", id);
        return NoContent();
    }

    /// <summary>
    /// Suspends the author of a review.
    /// </summary>
    [HttpPatch("reviews/{id}/suspend-author")]
    public async Task<ActionResult> SuspendReviewAuthor(int id)
    {
        var success = await _adminService.SuspendReviewAuthorAsync(id);
        if (!success)
            return NotFound(new { message = "Review or author not found, or author is SuperAdmin" });

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("Author of review {ReviewId} suspended by admin", id);
        return Ok(new { message = "Review author suspended successfully" });
    }
}
