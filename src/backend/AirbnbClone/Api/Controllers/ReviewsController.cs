using Application.DTOs;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReview(CreateReviewDto createReviewDto)
        {
            try
            {
                var guestId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(guestId))
                    return Unauthorized();

                var result = await _reviewService.CreateReviewAsync(createReviewDto, guestId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("listing/{listingId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListingReviews(int listingId)
        {
            var result = await _reviewService.GetListingReviewsAsync(listingId);
            return Ok(result);
        }

        [HttpGet("my-reviews")]
        public async Task<IActionResult> GetMyReviews()
        {
            var guestId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(guestId))
                return Unauthorized();

            var result = await _reviewService.GetUserReviewsAsync(guestId);
            return Ok(result);
        }

        [HttpGet("host/my-reviews")]
        public async Task<IActionResult> GetHostReviews()
        {
            var hostId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(hostId))
                return Unauthorized();

            var result = await _reviewService.GetHostReviewsAsync(hostId);
            return Ok(result);
        }

        [HttpGet("can-review/{bookingId}")]
        public async Task<IActionResult> CanReview(int bookingId)
        {
            var guestId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(guestId))
                return Unauthorized();

            var result = await _reviewService.CanUserReviewAsync(guestId, bookingId);
            return Ok(result);
        }

        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetReviewByBookingId(int bookingId)
        {
            var result = await _reviewService.GetReviewByBookingIdAsync(bookingId);
            return Ok(result);
        }

        [HttpGet("{reviewId}/can-edit")]
        public async Task<IActionResult> CanEditReview(int reviewId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _reviewService.CanEditReviewAsync(reviewId, userId);
            return Ok(result);
        }

        [HttpPut("{reviewId}")]
        public async Task<IActionResult> UpdateReview(int reviewId, UpdateReviewDto updateReviewDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var result = await _reviewService.UpdateReviewAsync(reviewId, updateReviewDto, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{reviewId}/can-delete")]
        public async Task<IActionResult> CanDeleteReview(int reviewId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _reviewService.CanDeleteReviewAsync(reviewId, userId);
            return Ok(result);
        }

        [HttpDelete("{reviewId}")]
        public async Task<IActionResult> DeleteReview(int reviewId, [FromBody] DeleteReviewDto? deleteDto = null)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var reason = deleteDto?.Reason ?? "";
                var result = await _reviewService.DeleteReviewAsync(reviewId, userId, reason);

                return Ok(new
                {
                    success = result,
                    message = "Review deleted successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}

