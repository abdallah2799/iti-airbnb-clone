using Application.DTOs.HostListings;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IO;

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


        [HttpPost("{listingId}/photos")]
        [Authorize] // [Authorize(Roles = "Host")] when roles are fixed
        public async Task<IActionResult> UploadPhoto(int listingId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            // --- START OF VALIDATION ---
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only .jpg, .jpeg, and .png are allowed." });
            }
            // --- END OF VALIDATION ---

            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var photoDto = await _listingService.AddPhotoToListAsync(listingId, file, hostId);
                return CreatedAtAction(nameof(GetListingById), new { id = listingId }, photoDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException ex)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error uploading photo: {ex.Message}" }); // 400
            }
        }

        [HttpGet("{listingId}/photos")]
        [Authorize] // Only the logged-in user (who we'll check is the host) can see this
        public async Task<IActionResult> GetPhotos(int listingId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized();
            }

            try
            {
                var photos = await _listingService.GetPhotosForListingAsync(listingId, hostId);
                return Ok(photos);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException ex)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                // Log the exception
                return BadRequest(new { message = $"Error getting photos: {ex.Message}" }); // 400
            }
        }
    }
}
