using Core.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repositories.Implementation
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Review>> GetReviewsByListingIdAsync(int listingId)
        {
            return await _dbSet
                .Include(r => r.Guest)
                .Where(r => r.ListingId == listingId)
                .OrderByDescending(r => r.DatePosted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByGuestIdAsync(string guestId)
        {
            return await _dbSet
                .Include(r => r.Listing)
                .Where(r => r.GuestId == guestId)
                .OrderByDescending(r => r.DatePosted)
                .ToListAsync();
        }

        public async Task<Review?> GetReviewByBookingIdAsync(int bookingId)
        {
            return await _dbSet
                .Include(r => r.Guest)
                .FirstOrDefaultAsync(r => r.BookingId == bookingId);
        }

        public async Task<double> GetAverageRatingAsync(int listingId)
        {
            var average = await _dbSet
                .Where(r => r.ListingId == listingId)
                .AverageAsync(r => (double?)r.Rating) ?? 0.0;

            return Math.Round(average, 1);
        }

        public async Task<Dictionary<int, double>> GetAverageDetailedRatingsAsync(int listingId)
        {
            var reviews = await _dbSet
                .Where(r => r.ListingId == listingId)
                .ToListAsync();

            var ratings = new Dictionary<int, double>
        {
            { 1, reviews.Where(r => r.Rating == 1).Count() },
            { 2, reviews.Where(r => r.Rating == 2).Count() },
            { 3, reviews.Where(r => r.Rating == 3).Count() },
            { 4, reviews.Where(r => r.Rating == 4).Count() },
            { 5, reviews.Where(r => r.Rating == 5).Count() }
        };

            return ratings;
        }

        public async Task<bool> HasUserReviewedListingAsync(string guestId, int listingId)
        {
            return await _dbSet
                .AnyAsync(r => r.GuestId == guestId && r.ListingId == listingId);
        }
    }
}