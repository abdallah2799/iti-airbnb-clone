using Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Interfaces
{
    public interface IReviewRepository : IRepository<Review>
    {
        Task<IEnumerable<Review>> GetReviewsByListingIdAsync(int listingId);
        Task<IEnumerable<Review>> GetReviewsByGuestIdAsync(string guestId);
        Task<IEnumerable<Review>> GetReviewsByHostIdAsync(string hostId);
        Task<Review?> GetReviewByBookingIdAsync(int bookingId);
        Task<double> GetAverageRatingAsync(int listingId);
        Task<Dictionary<int, double>> GetAverageDetailedRatingsAsync(int listingId);
        Task<bool> HasUserReviewedListingAsync(string guestId, int listingId);
        
        /// <summary>
        /// Sprint 6: Admin - Get paginated reviews for admin dashboard
        /// </summary>
        Task<(List<Review> Items, int TotalCount)> GetReviewsForAdminAsync(int page, int pageSize);
    }
}


