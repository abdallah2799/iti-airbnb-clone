using Application.DTOs.Listing;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Interfaces; // This line is critical - references IUnitOfWork
using Microsoft.Extensions.Logging;
using Core.Entities; // Add this if you get errors about Listing entity
using Core.Enums;    // Add this if you get errors about ListingStatus enum

namespace Application.Services.Implementation;

/// <summary>
/// Listing service implementation (Sprint 1)
/// Handles listing CRUD operations, search, and filtering
/// </summary>
public class ListingService : IListingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<ListingService> _logger;

    public ListingService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<ListingService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Story: [M] View All Listings (Homepage)
    /// Get all published listings with photos for homepage grid
    /// </summary>
    public async Task<IEnumerable<ListingCardDto>> GetAllListingsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all published listings for homepage");

            // Get all listings with photos
            var listings = await _unitOfWork.Listings.GetAllListingsWithPhotosAsync();

            // Filter only published listings
            var publishedListings = listings
                .Where(l => l.Status == Core.Enums.ListingStatus.Published)
                .ToList();

            _logger.LogInformation("Found {Count} published listings", publishedListings.Count);

            // Map to DTOs
            var listingDtos = _mapper.Map<IEnumerable<ListingCardDto>>(publishedListings);

            return listingDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all listings");
            throw;
        }
    }

    /// <summary>
    /// Story: [M] View Single Listing Details
    /// Get detailed information for a specific listing
    /// </summary>
    public async Task<ListingDetailDto?> GetListingByIdAsync(int listingId)
    {
        try
        {
            _logger.LogInformation("Fetching listing details for ID: {ListingId}", listingId);

            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);

            if (listing == null)
            {
                _logger.LogWarning("Listing not found: {ListingId}", listingId);
                return null;
            }

            // Only return if published (or host viewing their own)
            if (listing.Status != Core.Enums.ListingStatus.Published)
            {
                _logger.LogWarning("Listing {ListingId} is not published", listingId);
                return null;
            }

            var listingDto = _mapper.Map<ListingDetailDto>(listing);

            return listingDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching listing {ListingId}", listingId);
            throw;
        }
    }

    /// <summary>
    /// Story: [M] Search by Location
    /// Search listings by city or country
    /// </summary>
    public async Task<IEnumerable<ListingCardDto>> SearchByLocationAsync(string location)
    {
        try
        {
            _logger.LogInformation("Searching listings by location: {Location}", location);

            var listings = await _unitOfWork.Listings.SearchByLocationAsync(location);

            // Filter only published listings
            var publishedListings = listings
                .Where(l => l.Status == Core.Enums.ListingStatus.Published)
                .ToList();

            var listingDtos = _mapper.Map<IEnumerable<ListingCardDto>>(publishedListings);

            return listingDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching listings by location: {Location}", location);
            throw;
        }
    }

    /// <summary>
    /// Story: [S] Search by Available Dates
    /// Get available listings for date range
    /// </summary>
    public async Task<IEnumerable<ListingCardDto>> SearchByAvailableDatesAsync(DateTime startDate, DateTime endDate)
    {
        try
        {
            _logger.LogInformation("Searching listings available from {StartDate} to {EndDate}",
                startDate, endDate);

            var listings = await _unitOfWork.Listings.SearchByAvailableDatesAsync(startDate, endDate);

            // Filter only published listings
            var publishedListings = listings
                .Where(l => l.Status == Core.Enums.ListingStatus.Published)
                .ToList();

            var listingDtos = _mapper.Map<IEnumerable<ListingCardDto>>(publishedListings);

            return listingDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching listings by dates");
            throw;
        }
    }

    /// <summary>
    /// Story: [S] Filter by Number of Guests
    /// Filter listings that can accommodate specified number of guests
    /// </summary>
    public async Task<IEnumerable<ListingCardDto>> FilterByGuestsAsync(int numberOfGuests)
    {
        try
        {
            _logger.LogInformation("Filtering listings by guest count: {Guests}", numberOfGuests);

            var listings = await _unitOfWork.Listings.FilterByGuestsAsync(numberOfGuests);

            // Filter only published listings
            var publishedListings = listings
                .Where(l => l.Status == Core.Enums.ListingStatus.Published)
                .ToList();

            var listingDtos = _mapper.Map<IEnumerable<ListingCardDto>>(publishedListings);

            return listingDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error filtering listings by guests");
            throw;
        }
    }

    /// <summary>
    /// Get listings for a specific host
    /// </summary>
    public async Task<IEnumerable<ListingCardDto>> GetHostListingsAsync(string hostId)
    {
        try
        {
            _logger.LogInformation("Fetching listings for host: {HostId}", hostId);

            var listings = await _unitOfWork.Listings.GetHostListingsAsync(hostId);
            var listingDtos = _mapper.Map<IEnumerable<ListingCardDto>>(listings);

            return listingDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching host listings");
            throw;
        }
    }

    public async Task<IEnumerable<AmenityDto>> GetAllAmenitiesAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all amenities");

            // Get all amenities from database
            var amenities = await _unitOfWork.Amenities.GetAllAsync();

            // Map to DTOs
            var amenityDtos = _mapper.Map<IEnumerable<AmenityDto>>(amenities);

            return amenityDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching amenities");
            throw;
        }
    }

    public async Task<IEnumerable<LocationOptionDto>> GetUniqueLocationsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching unique locations with listing counts");

            // Get all published listings
            var listings = await _unitOfWork.Listings.GetAllListingsWithPhotosAsync();
            
            var publishedListings = listings
                .Where(l => l.Status == ListingStatus.Published)
                .ToList();

            // Group by city and country, count listings per location
            var locationGroups = publishedListings
                .GroupBy(l => new { l.City, l.Country })
                .Select(g => new LocationOptionDto
                {
                    City = g.Key.City,
                    Country = g.Key.Country,
                    ListingCount = g.Count()
                })
                .OrderByDescending(loc => loc.ListingCount)
                .ToList();

            _logger.LogInformation("Found {Count} unique locations", locationGroups.Count);

            return locationGroups;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching unique locations");
            throw;
        }
    }

    public async Task<IEnumerable<ListingCardDto>> GetListingsInAreaAsync(double minLat, double maxLat, double minLng, double maxLng, int guests)
    {
        var listings = await _unitOfWork.Listings.GetListingsInAreaAsync(minLat, maxLat, minLng, maxLng , guests);
        return _mapper.Map<IEnumerable<ListingCardDto>>(listings);
    }
}

