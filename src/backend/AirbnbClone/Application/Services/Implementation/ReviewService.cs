using Application.DTOs;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Implementation
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReviewService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto createReviewDto, string guestId)
        {
            // Validate booking exists and belongs to user
            var booking = await _unitOfWork.Bookings.GetByIdAsync(createReviewDto.BookingId);
            if (booking == null || booking.GuestId != guestId)
                throw new InvalidOperationException("Booking not found or access denied");

            // Check if review already exists for this booking
            var existingReview = await _unitOfWork.Reviews.GetReviewByBookingIdAsync(createReviewDto.BookingId);
            if (existingReview != null)
                throw new InvalidOperationException("You have already reviewed this booking");

            // Check if booking is completed and ended
            if (booking.EndDate > DateTime.UtcNow)
                throw new InvalidOperationException("You can only review completed bookings");

            // Check if booking was actually confirmed (not cancelled)
            if (booking.Status != BookingStatus.Confirmed)  // Changed from Completed to Confirmed
                throw new InvalidOperationException("You can only review confirmed bookings");

            var review = _mapper.Map<Review>(createReviewDto);
            review.GuestId = guestId;
            review.DatePosted = DateTime.UtcNow;

            await _unitOfWork.Reviews.AddAsync(review);
            await _unitOfWork.CompleteAsync();

            // Reload with guest information using Include
            var createdReview = await _unitOfWork.Reviews.GetReviewByBookingIdAsync(createReviewDto.BookingId);
            if (createdReview == null)
                throw new InvalidOperationException("Failed to create review");

            return _mapper.Map<ReviewDto>(createdReview);
        }

        public async Task<ListingReviewsDto> GetListingReviewsAsync(int listingId)
        {
            var reviews = await _unitOfWork.Reviews.GetReviewsByListingIdAsync(listingId);
            var averageRating = await _unitOfWork.Reviews.GetAverageRatingAsync(listingId);
            var ratingBreakdown = await _unitOfWork.Reviews.GetAverageDetailedRatingsAsync(listingId);

            var listingReviews = new ListingReviewsDto
            {
                AverageRating = averageRating,
                TotalReviews = reviews.Count(),
                RatingBreakdown = ratingBreakdown,
                Reviews = _mapper.Map<List<ReviewDto>>(reviews)
            };

            return listingReviews;
        }

        public async Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(string guestId)
        {
            var reviews = await _unitOfWork.Reviews.GetReviewsByGuestIdAsync(guestId);
            return _mapper.Map<IEnumerable<ReviewDto>>(reviews);
        }

        public async Task<bool> CanUserReviewAsync(string guestId, int bookingId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
            if (booking == null || booking.GuestId != guestId)
                return false;

            var existingReview = await _unitOfWork.Reviews.GetReviewByBookingIdAsync(bookingId);
            var isBookingCompleted = booking.EndDate <= DateTime.UtcNow && booking.Status == BookingStatus.Confirmed;  // Changed from Completed to Confirmed

            return isBookingCompleted && existingReview == null;
        }

        public async Task<ReviewDto?> GetReviewByBookingIdAsync(int bookingId)
        {
            var review = await _unitOfWork.Reviews.GetReviewByBookingIdAsync(bookingId);
            return review == null ? null : _mapper.Map<ReviewDto>(review);
        }
        public async Task<bool> CanEditReviewAsync(int reviewId, string userId)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null || review.GuestId != userId)
                return false;

            // Allow editing within 48 hours
            return review.DatePosted >= DateTime.UtcNow.AddHours(-48);
        }

        public async Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateReviewDto, string userId)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null || review.GuestId != userId)
                throw new InvalidOperationException("Review not found or access denied");

            // Check if within edit period (48 hours)
            if (review.DatePosted < DateTime.UtcNow.AddHours(-48))
                throw new InvalidOperationException("Review can only be edited within 48 hours");

            // Update review fields
            review.Rating = updateReviewDto.Rating;
            review.CleanlinessRating = updateReviewDto.CleanlinessRating;
            review.AccuracyRating = updateReviewDto.AccuracyRating;
            review.CommunicationRating = updateReviewDto.CommunicationRating;
            review.LocationRating = updateReviewDto.LocationRating;
            review.CheckInRating = updateReviewDto.CheckInRating;
            review.ValueRating = updateReviewDto.ValueRating;
            review.Comment = updateReviewDto.Comment;

            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.CompleteAsync();

            // Reload with guest information
            var updatedReview = await _unitOfWork.Reviews.GetReviewByBookingIdAsync(review.BookingId);
            if (updatedReview == null)
                throw new InvalidOperationException("Failed to update review");

            return _mapper.Map<ReviewDto>(updatedReview);
        }

        public async Task<bool> CanDeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null || review.GuestId != userId)
                return false;

            // Allow deletion within 48 hours
            return review.DatePosted >= DateTime.UtcNow.AddHours(-48);
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, string userId, string reason = "")
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null || review.GuestId != userId)
                throw new InvalidOperationException("Review not found or access denied");

            // Check if within delete period (48 hours)
            if (review.DatePosted < DateTime.UtcNow.AddHours(-48))
                throw new InvalidOperationException("Review can only be deleted within 48 hours");

            _unitOfWork.Reviews.Remove(review);
            await _unitOfWork.CompleteAsync();

            return true;
        }
    }
}


