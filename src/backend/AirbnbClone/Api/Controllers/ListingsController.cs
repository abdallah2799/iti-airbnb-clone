using Application.DTOs.Listing;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Manages property listings operations
/// </summary>
/// <remarks>
/// This controller handles all listing-related endpoints for the Airbnb Clone API.
/// 
/// **Sprint 1 Focus**: Core listing features
/// - View all listings (homepage grid)
/// - View single listing details
/// - Search by location
/// - Filter by dates and guests
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly ILogger<ListingsController> _logger;

    public ListingsController(
        IListingService listingService,
        ILogger<ListingsController> logger)
    {
        _listingService = listingService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all published listings for homepage display
    /// </summary>
    /// <remarks>
    /// Returns a grid of all available listings with basic information.
    /// 
    /// **User Story**: [M] Guest: View Homepage Grid of All Listings (Sprint 1 - Story 1)
    /// 
    /// **Use Cases:**
    /// - Homepage listing grid display
    /// - Browse all available properties
    /// - Initial page load for guests
    /// 
    /// **Response Data (per listing):**
    /// - Listing ID, title, location (city, country)
    /// - Price per night with currency
    /// - Property type (apartment, house, villa, etc.)
    /// - Capacity (max guests, bedrooms, bathrooms)
    /// - Cover photo URL
    /// - Average rating and review count
    /// - Host information (name, super host status)
    /// 
    /// **Business Rules:**
    /// - Only returns listings with status = "Published"
    /// - Listings are returned in no specific order (can be enhanced with sorting)
    /// - Includes only the cover photo for performance
    /// - Calculates average rating from all reviews
    /// 
    /// **Performance Considerations:**
    /// - Query optimized with Include statements for photos and reviews
    /// - Returns minimal data needed for card display
    /// - Consider pagination for large datasets (future enhancement)
    /// 
    /// **Example Response:**
    /// ```json
    /// [
    ///   {
    ///     "id": 1,
    ///     "title": "Cozy Downtown Apartment",
    ///     "city": "New York",
    ///     "country": "USA",
    ///     "pricePerNight": 150.00,
    ///     "currency": "USD",
    ///     "propertyType": 0,
    ///     "maxGuests": 4,
    ///     "numberOfBedrooms": 2,
    ///     "numberOfBathrooms": 1,
    ///     "coverPhotoUrl": "https://example.com/photo1.jpg",
    ///     "averageRating": 4.8,
    ///     "reviewCount": 24,
    ///     "hostName": "John Doe",
    ///     "isSuperHost": true
    ///   }
    /// ]
    /// ```
    /// </remarks>
    /// <returns>Returns a list of all published listings</returns>
    /// <response code="200">Listings retrieved successfully. Returns array of listing cards.</response>
    /// <response code="500">Internal server error occurred while retrieving listings.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ListingCardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllListings()
    {
        // Sprint 1 - Story 1: View Homepage Grid of All Listings
        try
        {
            var listings = await _listingService.GetAllListingsAsync();

            _logger.LogInformation("Retrieved {Count} listings for homepage", listings.Count());

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all listings");
            return StatusCode(500, new { message = "An error occurred while retrieving listings" });
        }
    }

    /// <summary>
    /// Retrieves detailed information for a specific listing
    /// </summary>
    /// <remarks>
    /// Returns comprehensive details about a single listing.
    /// 
    /// **User Story**: [M] Guest: View Single Listing Details (Sprint 1 - Story 2)
    /// 
    /// **Use Cases:**
    /// - View full listing details before booking
    /// - See all photos, amenities, and reviews
    /// - Check availability calendar
    /// - Contact host
    /// 
    /// **Response Data:**
    /// - Complete listing information (title, description, pricing)
    /// - All photos (not just cover)
    /// - All amenities with categories
    /// - All reviews with guest information
    /// - Host profile with response rate and verification status
    /// - Booking rules (minimum nights, check-in/out times, cancellation policy)
    /// - Location details (address, coordinates for map)
    /// 
    /// **Business Rules:**
    /// - Only returns published listings (status = "Published")
    /// - Returns 404 if listing not found or not published
    /// - Includes calculated average rating from all reviews
    /// - Shows host information but protects sensitive data
    /// 
    /// **Implementation Notes:**
    /// 1. Extract listingId from route parameter
    /// 2. Call ListingService.GetListingByIdAsync(listingId)
    /// 3. Service loads listing with all related entities (photos, amenities, reviews, host)
    /// 4. Returns 404 if not found or not published
    /// 5. Returns detailed DTO with all information
    /// </remarks>
    /// <param name="id">The unique identifier of the listing</param>
    /// <returns>Returns detailed listing information</returns>
    /// <response code="200">Listing details retrieved successfully.</response>
    /// <response code="404">Listing not found or not published.</response>
    /// <response code="500">Internal server error occurred while retrieving listing details.</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetListingById(int id)
    {
        // Sprint 1 - Story 2: View Single Listing Details
        try
        {
            var listing = await _listingService.GetListingByIdAsync(id);

            if (listing == null)
            {
                _logger.LogWarning("Listing {ListingId} not found or not published", id);
                return NotFound(new { message = "Listing not found" });
            }

            _logger.LogInformation("Retrieved listing details for ID: {ListingId}", id);

            return Ok(listing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving listing {ListingId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving listing details" });
        }
    }

    /// <summary>
    /// Searches listings by location (city or country)
    /// </summary>
    /// <remarks>
    /// Returns listings that match the specified location.
    /// 
    /// **User Story**: [M] Guest: Search by Location (Sprint 1 - Story 3)
    /// 
    /// **Search Logic:**
    /// - Searches in both City and Country fields
    /// - Case-insensitive partial match
    /// - Example: "york" matches "New York", "York", "Yorkshire"
    /// 
    /// **Use Cases:**
    /// - Search for listings in a specific city
    /// - Find properties in a country
    /// - Filter homepage by destination
    /// 
    /// **Business Rules:**
    /// - Only returns published listings
    /// - Empty location string returns empty result
    /// - Search is case-insensitive
    /// - Partial matches are supported
    /// 
    /// **Query Parameters:**
    /// - location (required): Search term for city or country
    /// 
    /// **Example Request:**
    /// ```
    /// GET /api/listings/search?location=Paris
    /// GET /api/listings/search?location=France
    /// ```
    /// </remarks>
    /// <param name="location">Search term for city or country name</param>
    /// <returns>Returns listings matching the location search</returns>
    /// <response code="200">Search completed successfully. Returns matching listings.</response>
    /// <response code="400">Location parameter is missing or invalid.</response>
    /// <response code="500">Internal server error occurred during search.</response>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ListingCardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SearchByLocation([FromQuery] string location)
    {
        // Sprint 1 - Story 3: Search by Location
        if (string.IsNullOrWhiteSpace(location))
        {
            return BadRequest(new { message = "Location parameter is required" });
        }

        try
        {
            var listings = await _listingService.SearchByLocationAsync(location);

            _logger.LogInformation("Search by location '{Location}' returned {Count} results",
                location, listings.Count());

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching listings by location: {Location}", location);
            return StatusCode(500, new { message = "An error occurred during search" });
        }
    }

    /// <summary>
    /// Filters listings by available date range
    /// </summary>
    /// <remarks>
    /// Returns listings that are available for the specified date range.
    /// 
    /// **User Story**: [S] Guest: Search by Available Dates (Sprint 1 - Story 4)
    /// 
    /// **Availability Logic:**
    /// - Excludes listings with conflicting bookings
    /// - Excludes listings with blocked dates in the range
    /// - Checks that requested dates don't overlap with existing bookings
    /// 
    /// **Business Rules:**
    /// - Only returns published listings
    /// - StartDate must be before EndDate
    /// - Dates should be in the future (past dates may return empty results)
    /// - A listing is available if no bookings or blocked dates conflict
    /// 
    /// **Query Parameters:**
    /// - startDate (required): Check-in date (ISO 8601 format)
    /// - endDate (required): Check-out date (ISO 8601 format)
    /// 
    /// **Example Request:**
    /// ```
    /// GET /api/listings/filter/dates?startDate=2024-12-20&endDate=2024-12-25
    /// ```
    /// </remarks>
    /// <param name="startDate">Check-in date</param>
    /// <param name="endDate">Check-out date</param>
    /// <returns>Returns listings available for the specified dates</returns>
    /// <response code="200">Filter completed successfully. Returns available listings.</response>
    /// <response code="400">Invalid date parameters (missing, invalid format, or startDate after endDate).</response>
    /// <response code="500">Internal server error occurred during filtering.</response>
    [HttpGet("filter/dates")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ListingCardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> FilterByDates([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        // Sprint 1 - Story 4: Search by Available Dates
        if (startDate == default || endDate == default)
        {
            return BadRequest(new { message = "Both startDate and endDate are required" });
        }

        if (startDate >= endDate)
        {
            return BadRequest(new { message = "StartDate must be before EndDate" });
        }

        try
        {
            var listings = await _listingService.SearchByAvailableDatesAsync(startDate, endDate);

            _logger.LogInformation("Filter by dates {StartDate} to {EndDate} returned {Count} results",
                startDate, endDate, listings.Count());

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error filtering listings by dates");
            return StatusCode(500, new { message = "An error occurred during filtering" });
        }
    }

    /// <summary>
    /// Filters listings by number of guests
    /// </summary>
    /// <remarks>
    /// Returns listings that can accommodate the specified number of guests.
    /// 
    /// **User Story**: [S] Guest: Filter by Number of Guests (Sprint 1 - Story 5)
    /// 
    /// **Filtering Logic:**
    /// - Returns listings where MaxGuests >= requested number
    /// - Helps guests find suitable accommodations for their group size
    /// 
    /// **Business Rules:**
    /// - Only returns published listings
    /// - Number of guests must be positive (> 0)
    /// - Listings with higher capacity are included
    /// 
    /// **Query Parameters:**
    /// - guests (required): Number of guests (must be > 0)
    /// 
    /// **Example Request:**
    /// ```
    /// GET /api/listings/filter/guests?guests=4
    /// ```
    /// </remarks>
    /// <param name="guests">Number of guests</param>
    /// <returns>Returns listings that can accommodate the specified number of guests</returns>
    /// <response code="200">Filter completed successfully. Returns suitable listings.</response>
    /// <response code="400">Invalid guests parameter (missing, zero, or negative).</response>
    /// <response code="500">Internal server error occurred during filtering.</response>
    [HttpGet("filter/guests")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ListingCardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> FilterByGuests([FromQuery] int guests)
    {
        // Sprint 1 - Story 5: Filter by Number of Guests
        if (guests <= 0)
        {
            return BadRequest(new { message = "Number of guests must be greater than 0" });
        }

        try
        {
            var listings = await _listingService.FilterByGuestsAsync(guests);

            _logger.LogInformation("Filter by guests {Guests} returned {Count} results",
                guests, listings.Count());

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error filtering listings by guests");
            return StatusCode(500, new { message = "An error occurred during filtering" });
        }
    }

    /// <summary>
    /// Retrieves all listings for a specific host
    /// </summary>
    /// <remarks>
    /// Returns all listings owned by the specified host.
    /// 
    /// **Use Cases:**
    /// - View host's portfolio of properties
    /// - Display "Other listings by this host" section
    /// - Host management interface
    /// 
    /// **Business Rules:**
    /// - Returns all listing statuses (including drafts) for the host themselves
    /// - Returns only published listings for other users viewing
    /// - Includes all listing information and photos
    /// </remarks>
    /// <param name="hostId">The unique identifier of the host</param>
    /// <returns>Returns all listings for the specified host</returns>
    /// <response code="200">Listings retrieved successfully.</response>
    /// <response code="400">Invalid host ID format.</response>
    /// <response code="500">Internal server error occurred while retrieving listings.</response>
    [HttpGet("host/{hostId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ListingCardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetHostListings(string hostId)
    {
        if (string.IsNullOrWhiteSpace(hostId))
        {
            return BadRequest(new { message = "Host ID is required" });
        }

        try
        {
            var listings = await _listingService.GetHostListingsAsync(hostId);

            _logger.LogInformation("Retrieved {Count} listings for host {HostId}",
                listings.Count(), hostId);

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving listings for host {HostId}", hostId);
            return StatusCode(500, new { message = "An error occurred while retrieving listings" });
        }
    }

    // Add this to your Api/Controllers/ListingsController.cs

    /// <summary>
    /// Retrieves all available amenities
    /// </summary>
    /// <remarks>
    /// Returns a list of all amenities that can be assigned to listings.
    /// Used for displaying amenity filters and listing amenities.
    /// </remarks>
    /// <returns>Returns list of all amenities grouped by category</returns>
    /// <response code="200">Amenities retrieved successfully.</response>
    /// <response code="500">Internal server error occurred.</response>
    [HttpGet("amenities")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<AmenityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllAmenities()
    {
        try
        {
            var amenities = await _listingService.GetAllAmenitiesAsync();

            _logger.LogInformation("Retrieved {Count} amenities", amenities.Count());

            return Ok(amenities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving amenities");
            return StatusCode(500, new { message = "An error occurred while retrieving amenities" });
        }
    }


    /// <summary>
    /// Searches for listings within a specific map viewport (bounding box).
    /// </summary>
    [HttpGet("map-search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchMap(
         [FromQuery] double minLat,
         [FromQuery] double maxLat,
         [FromQuery] double minLng,
         [FromQuery] double maxLng,
         [FromQuery] int guests = 0)
    {
        try
        {
            var listings = await _listingService.GetListingsInAreaAsync(minLat, maxLat, minLng, maxLng, guests);
            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching map area");
            return StatusCode(500, new { message = "Error searching map" });
        }
    }
}