using Application.DTOs.Listing;

namespace Application.Services.Interfaces;

/// <summary>
/// Listing service interface (Sprint 1)
/// Handles listing operations including CRUD, search, and filtering
/// </summary>
public interface IListingService
{
    /// <summary>
    /// Story: [M] View All Listings (Homepage)
    /// Get all published listings for homepage grid display
    /// </summary>
    Task<IEnumerable<ListingCardDto>> GetAllListingsAsync();

    /// <summary>
    /// Story: [M] View Single Listing Details
    /// Get detailed information for a specific listing
    /// </summary>
    Task<ListingDetailDto?> GetListingByIdAsync(int listingId);

    /// <summary>
    /// Story: [M] Search by Location
    /// Search listings by city or country
    /// </summary>
    Task<IEnumerable<ListingCardDto>> SearchByLocationAsync(string location);

    /// <summary>
    /// Story: [S] Search by Available Dates
    /// Get available listings for date range
    /// </summary>
    Task<IEnumerable<ListingCardDto>> SearchByAvailableDatesAsync(DateTime startDate, DateTime endDate);

    /// <summary>
    /// Story: [S] Filter by Number of Guests
    /// Filter listings that can accommodate specified number of guests
    /// </summary>
    Task<IEnumerable<ListingCardDto>> FilterByGuestsAsync(int numberOfGuests);

    /// <summary>
    /// Get listings for a specific host
    /// </summary>
    Task<IEnumerable<ListingCardDto>> GetHostListingsAsync(string hostId);

    /// <summary>
    /// Get all available amenities
    /// </summary>
    Task<IEnumerable<AmenityDto>> GetAllAmenitiesAsync();
}