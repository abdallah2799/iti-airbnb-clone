using Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Interfaces
{
    /// <summary>
    /// Review service interface
    /// Handles review operations including creation, retrieval, and validation
    /// </summary>
    public interface IReviewService
    {
        /// <summary>
        /// Story: [M] Create Review for Completed Booking
        /// Create a new review for a completed booking
        /// </summary>
        Task<ReviewDto> CreateReviewAsync(CreateReviewDto createReviewDto, string guestId);

        /// <summary>
        /// Story: [M] View Listing Reviews
        /// Get all reviews for a specific listing with average ratings
        /// </summary>
        Task<ListingReviewsDto> GetListingReviewsAsync(int listingId);

        /// <summary>
        /// Story: [M] View My Reviews
        /// Get all reviews written by the current user
        /// </summary>
        Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(string guestId);

        /// <summary>
        /// Story: [S] Check Review Eligibility
        /// Check if user can review a specific booking
        /// </summary>
        Task<bool> CanUserReviewAsync(string guestId, int bookingId);

        /// <summary>
        /// Get review by booking ID
        /// </summary>
        Task<ReviewDto?> GetReviewByBookingIdAsync(int bookingId);

        Task<bool> CanEditReviewAsync(int reviewId, string userId);
        Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateReviewDto, string userId);
        Task<bool> CanDeleteReviewAsync(int reviewId, string userId);
        Task<bool> DeleteReviewAsync(int reviewId, string userId, string reason = "");
    }
}


