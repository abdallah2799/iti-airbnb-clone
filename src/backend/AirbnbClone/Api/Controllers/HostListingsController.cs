using Application.DTOs.HostListings;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; // Required for getting User ID from token

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostListingsController : ControllerBase
    {
        private readonly IHostListingService _listingService;

        public HostListingsController(IHostListingService listingService)
        {
            _listingService = listingService;
        }

        [HttpPost]
     //   [Authorize(Roles = "Host")] // Ensures only users with the "Host" role can create
        [Authorize]
        public async Task<IActionResult> CreateListing([FromBody] CreateListingDto listingDto)
        {
            // Get the authenticated user's ID from their JWT token
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var newListingId = await _listingService.CreateListingAsync(listingDto, hostId);

                // Return a 201 Created response
                // This includes the new listing's ID and a URL to "get" the new resource
                return CreatedAtAction(nameof(GetListingById),
                    new { id = newListingId },
                    new { listingId = newListingId });
            }
            catch (Exception ex)
            {
                // In a real app, you'd log this exception
                return BadRequest(new { message = $"Error creating listing: {ex.Message}" });
            }
        }

        //   [Authorize(Roles = "Host")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListingById(int id)
        {
            // 1. Call the service
            var listingDto = await _listingService.GetListingByIdAsync(id);

            // 2. Check if the service found anything
            if (listingDto == null)
            {
                return NotFound(new { message = $"Listing with ID {id} not found." }); // Returns 404
            }

            // 3. Return the DTO
            return Ok(listingDto); // Returns 200 with the listing details
        }
    }
}
    