using Core.Entities;

namespace Infrastructure.Repositories;

/// <summary>
/// Repository interface for Listing operations (Sprint 1)
/// </summary>
public interface IListingRepository : IRepository<Listing>
{
    /// <summary>
    /// Story: [M] View Single Listing Details - Get listing with all related data
    /// </summary>
    Task<Listing?> GetListingWithDetailsAsync(int listingId);


  Task<Listing?> GetListingWithDetailsandBookingsAsync(int listingId);


    /// <summary>
    /// Story: [M] View All Listings (Homepage) - Get all listings with photos
    /// </summary>
    Task<IEnumerable<Listing>> GetAllListingsWithPhotosAsync();

    /// <summary>
    /// Story: [M] Search by Location - Search listings by city or country
    /// </summary>
    Task<IEnumerable<Listing>> SearchByLocationAsync(string location);

    /// <summary>
    /// Story: [S] Search by Available Dates - Get available listings for date range
    /// </summary>
    Task<IEnumerable<Listing>> SearchByAvailableDatesAsync(DateTime startDate, DateTime endDate);

    /// <summary>
    /// Story: [S] Filter by Number of Guests
    /// </summary>
    Task<IEnumerable<Listing>> FilterByGuestsAsync(int numberOfGuests);

    /// <summary>
    /// Get listings for a specific host
    /// </summary>
    Task<IEnumerable<Listing>> GetHostListingsAsync(string hostId);

    /// <summary>
    /// Get listing with reviews
    /// </summary>
    Task<Listing?> GetListingWithReviewsAsync(int listingId);


    Task<IEnumerable<Listing>> GetListingsInAreaAsync(double minLat, double maxLat, double minLng, double maxLng);

    /// <summary>
    /// Sprint 6: Admin - Get paginated listings with host for admin dashboard
    /// </summary>
    Task<(List<Listing> Items, int TotalCount)> GetListingsForAdminAsync(int page, int pageSize);
}
