using Application.DTOs;
using Application.DTOs.Admin;
using Core.Enums;

namespace Application.Services.Interfaces;

/// <summary>
/// Defines operations for managing platform resources by SuperAdmin users.
/// </summary>
/// <remarks>
/// Provides CRUD and status management capabilities for users, listings, and bookings.
/// 
/// **Sprint 6 User Story**: [A] As an Admin, I want to manage users, listings, and bookings.
/// 
/// **Security**: All operations assume the caller is authenticated as SuperAdmin.
/// Actual authorization enforced at controller level via [Authorize(Roles = "SuperAdmin")].
/// 
/// **Implementation Notes**:
/// - Methods return true/false for success/failure
/// - DTOs are used for all input/output to avoid exposing domain entities
/// - Pagination supported via PagedResult&lt;T&gt;
/// </remarks>
public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardDataAsync();

    // ============= USER MANAGEMENT =============

    /// <summary>
    /// Retrieves a paginated list of all users.
    /// </summary>
    Task<PagedResult<AdminUserDto>> GetUsersAsync(int page, int pageSize);

    /// <summary>
    /// Retrieves a specific user by ID.
    /// </summary>
    Task<AdminUserDto?> GetUserByIdAsync(string userId);

    /// <summary>
    /// Suspends a user account (soft delete via EmailConfirmed = false).
    /// </summary>
    /// <returns>False if user is SuperAdmin (protection rule).</returns>
    Task<bool> SuspendUserAsync(string userId);

    /// <summary>
    /// Un-suspends a user account (restore via EmailConfirmed = true).
    /// </summary>
    /// <returns>False if user is SuperAdmin (protection rule).</returns>
    Task<bool> UnSuspendUserAsync(string userId);

    /// <summary>
    /// Permanently deletes a user account.
    /// </summary>
    /// <returns>False if user is SuperAdmin (protection rule).</returns>
    Task<bool> DeleteUserAsync(string userId);

    // ============= LISTING MANAGEMENT =============

    /// <summary>
    /// Retrieves a paginated list of all listings.
    /// </summary>
    Task<PagedResult<AdminListingDto>> GetListingsAsync(int page, int pageSize, string? status = null);

    /// <summary>
    /// Retrieves a specific listing by ID with full details.
    /// </summary>
    Task<AdminListingDto?> GetListingByIdAsync(int listingId);

    /// <summary>
    /// Updates the status of a listing (e.g., Published, Suspended).
    /// </summary>
    Task<bool> UpdateListingStatusAsync(int listingId, ListingStatus status);

    /// <summary>
    /// Permanently deletes a listing.
    /// </summary>
    /// <returns>False if listing has confirmed bookings (business rule).</returns>
    Task<bool> DeleteListingAsync(int listingId);

    // ============= BOOKING MANAGEMENT =============

    /// <summary>
    /// Retrieves a paginated list of all bookings.
    /// </summary>
    Task<PagedResult<AdminBookingDto>> GetBookingsAsync(int page, int pageSize);

    /// <summary>
    /// Retrieves a specific booking by ID with full details.
    /// </summary>
    Task<AdminBookingDto?> GetBookingByIdAsync(int bookingId);

    /// <summary>
    /// Updates the status of a booking (e.g., Confirmed, Cancelled).
    /// </summary>
    /// <returns>False if transition is invalid (e.g., Confirmed ? Pending).</returns>
    Task<bool> UpdateBookingStatusAsync(int bookingId, BookingStatus status);

    /// <summary>
    /// Permanently deletes a booking.
    /// </summary>
    /// <returns>False if booking status is Confirmed (business rule).</returns>
    Task<bool> DeleteBookingAsync(int bookingId);

    // ============= REVIEW MANAGEMENT =============

    /// <summary>
    /// Retrieves a paginated list of all reviews.
    /// </summary>
    Task<PagedResult<AdminReviewDto>> GetReviewsAsync(int page, int pageSize);

    /// <summary>
    /// Permanently deletes a review.
    /// </summary>
    Task<bool> DeleteReviewAsync(int reviewId);

    /// <summary>
    /// Suspends the author of a specific review.
    /// </summary>
    Task<bool> SuspendReviewAuthorAsync(int reviewId);
}

