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
     //   [Authorize(Roles = "Host")] 
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

        [HttpPut("{id}")]
        [Authorize] // [Authorize(Roles = "Host")] when roles are fixed
        public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingDto listingDto)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized();
            }

            try
            {
                var success = await _listingService.UpdateListingAsync(id, listingDto, hostId);
                if (success)
                {
                    return NoContent(); // 204 No Content is standard for a successful PUT
                }
                return BadRequest(new { message = "Failed to update listing." });
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
                return BadRequest(new { message = $"Error updating listing: {ex.Message}" }); // 400
            }
        }

        [HttpGet("{listingId}/photos/{photoId}")]
        [Authorize]
        public async Task<IActionResult> GetPhotoById(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var photoDto = await _listingService.GetPhotoByIdAsync(listingId, photoId, hostId);
                return Ok(photoDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (AccessViolationException)
            {
                return Forbid();
            }
        }

        // --- ADD 'DELETE PHOTO' ENDPOINT ---
        [HttpDelete("{listingId}/photos/{photoId}")]
        [Authorize]
        public async Task<IActionResult> DeletePhoto(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.DeletePhotoAsync(listingId, photoId, hostId);
                return NoContent(); // 204 No Content
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (AccessViolationException)
            {
                return Forbid();
            }
        }

        // --- 'SET COVER PHOTO' ENDPOINT ---
        [HttpPut("{listingId}/photos/{photoId}/set-cover")]
        [Authorize]
        public async Task<IActionResult> SetCoverPhoto(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.SetCoverPhotoAsync(listingId, photoId, hostId);
                return NoContent(); // 204 No Content
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (AccessViolationException)
            {
                return Forbid();
            }
        }

        [HttpDelete("{id}")]
        [Authorize] // [Authorize(Roles = "Host")] when roles are fixed
        public async Task<IActionResult> DeleteListing(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized();
            }

            try
            {
                await _listingService.DeleteListingAsync(id, hostId);
                return NoContent(); // 204 No Content 
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
                // This might happen if there's a database constraint (e.g., a booking
                // that can't be deleted).
                return BadRequest(new { message = $"Error deleting listing: {ex.Message}" }); // 400
            }
        }
    }
}
