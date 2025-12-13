using Application.DTOs.HostListings;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IO;
using Microsoft.AspNetCore.Http; 
using System.Security.AccessControl;

namespace Api.Controllers
{
    /// <summary>
    /// Manages property listings owned by the authenticated host.
    /// </summary>
    /// <remarks>
    /// This controller handles all CRUD operations for a host's own listings,
    /// including managing photos (upload, delete, set cover).
    /// All endpoints require authentication.
    /// </remarks>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")] // Per documentation standards
    [Authorize(Roles = "Host")]
    public class HostListingsController : ControllerBase
    {
        private readonly IHostListingService _listingService;

        public HostListingsController(IHostListingService listingService)
        {
            _listingService = listingService;
        }

        /// <summary>
        /// Creates a new listing for the authenticated host.
        /// </summary>
        /// <remarks>
        /// This endpoint creates the core listing entity. Photos must be uploaded separately.
        /// Business Rules:
        /// - User must be authenticated.
        /// - Listing is created with a 'Draft' status.
        /// </remarks>
        /// <param name="listingDto">The data for the new listing (title, price, address, etc.).</param>
        /// <returns>The ID and location of the newly created listing.</returns>
        /// <response code="201">Listing successfully created. Returns the location of the new resource.</response>
        /// <response code="400">Invalid request data (e.g., validation failure).</response>
        /// <response code="401">User is not authenticated.</response>
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CreateListing([FromBody] HostCreateListingDto listingDto)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var newListingId = await _listingService.CreateListingAsync(listingDto, hostId);

                return CreatedAtAction(nameof(GetListingById),
                    new { id = newListingId },
                    new { listingId = newListingId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error creating listing: {ex.Message}" });
            }
        }

        /// <summary>
        /// Gets a specific listing owned by the authenticated host.
        /// </summary>
        /// <remarks>
        /// Business Rules:
        /// - User must be authenticated.
        /// - User must be the owner (host) of the listing.
        /// </remarks>
        /// <param name="id">The unique identifier of the listing to retrieve.</param>
        /// <returns>The listing details.</returns>
        /// <response code="200">Listing found and returned successfully.</response>
        /// <response code="401">User is not authenticated.</response>
        /// <response code="403">User is authenticated but does not own this listing.</response>
        /// <response code="404">Listing with the specified ID was not found.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(HostListingDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetListingById(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                // We pass the hostId to enforce security
                var listingDto = await _listingService.GetListingByIdAsync(id, hostId);

                if (listingDto == null)
                {
                    return NotFound(new { message = $"Listing with ID {id} not found." }); // 404
                }

                return Ok(listingDto); // 200
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
        }



        /// <summary>
        /// Gets all listings owned by the authenticated host.
        /// </summary>
        /// <remarks>
        /// Returns a list of the host's listings (Draft, Published, etc.) including their status.
        /// </remarks>
        /// <returns>A list of listing summaries.</returns>
        /// <response code="200">Returns the list of listings (can be empty).</response>
        /// <response code="401">User is not authenticated.</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<HostListingDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAllListings()
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var listings = await _listingService.GetAllHostListingsAsync(hostId);
                return Ok(listings); // Returns 200 with JSON array (even if empty)
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error retrieving listings: {ex.Message}" });
            }
        }


        /// <summary>
        /// Updates an existing listing owned by the authenticated host.
        /// </summary>
        /// <remarks>
        /// Business Rules:
        /// - User must be authenticated and the owner of the listing.
        /// </remarks>
        /// <param name="id">The unique identifier of the listing to update.</param>
        /// <param name="listingDto">The new data for the listing.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">Listing was updated successfully.</response>
        /// <response code="400">Invalid request data (e.g., validation failure).</response>
        /// <response code="401">User is not authenticated.</response>
        /// <response code="403">User is authenticated but does not own this listing.</response>
        /// <response code="404">Listing with the specified ID was not found.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] HostUpdateListingDto listingDto)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.UpdateListingAsync(id, listingDto, hostId);
                return NoContent(); // 204
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error updating listing: {ex.Message}" }); // 400
            }
        }

        /// <summary>
        /// Deletes one of the host's listings.
        /// </summary>
        /// <remarks>
        /// This will also delete all associated photos, bookings, and reviews (via cascade delete).
        /// </remarks>
        /// <param name="id">The ID of the listing to delete.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">The listing was deleted successfully.</response>
        /// <response code="401">If the user is not authenticated.</response>
        /// <response code="403">If the authenticated user does not own this listing.</response>
        /// <response code="404">If the listing is not found.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.DeleteListingAsync(id, hostId);
                return NoContent(); // 204
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting listing: {ex.Message}" }); // 400
            }
        }

        // --- Photo Endpoints ---

        /// <summary>
        /// Gets all photos for a specific listing owned by the host.
        /// </summary>
        /// <param name="listingId">The ID of the listing.</param>
        /// <returns>A list of all photos for the listing.</returns>
        /// <response code="200">Returns a list of all photos for the listing.</response>
        /// <response code="401">If the user is not authenticated.</response>
        /// <response code="403">If the authenticated user does not own this listing.</response>
        /// <response code="404">If the listing is not found.</response>
        [HttpGet("{listingId}/photos")]
        [ProducesResponseType(typeof(IEnumerable<PhotoDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPhotos(int listingId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var photos = await _listingService.GetPhotosForListingAsync(listingId, hostId);
                return Ok(photos); // 200
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error getting photos: {ex.Message}" }); // 400
            }
        }

        /// <summary>
        /// Gets a single photo by its ID.
        /// </summary>
        /// <param name="listingId">The ID of the listing.</param>
        /// <param name="photoId">The ID of the photo to retrieve.</param>
        /// <returns>The photo details.</returns>
        /// <response code="200">Returns the photo details.</response>
        /// <response code="401">If the user is not authenticated.</response>
        /// <response code="403">If the authenticated user does not own this listing.</response>
        /// <response code="404">If the listing or photo is not found.</response>
        [HttpGet("{listingId}/photos/{photoId}")]
        [ProducesResponseType(typeof(PhotoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPhotoById(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var photoDto = await _listingService.GetPhotoByIdAsync(listingId, photoId, hostId);
                return Ok(photoDto); // 200
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
        }

        /// <summary>
        /// Uploads a new photo for a listing.
        /// </summary>
        /// <remarks>
        /// This endpoint accepts `multipart/form-data`.
        /// Validation Rules:
        /// - Only .jpg, .jpeg, and .png are allowed.
        /// - The first photo uploaded will automatically be set as the cover.
        /// Returns the full, updated list of photos for the listing.
        /// </remarks>
        /// <param name="listingId">The ID of the listing to add a photo to.</param>
        /// <param name="file">The photo file to upload (must be IFormFile).</param>
        /// <returns>The complete, updated list of photos for the listing.</returns>
        /// <response code="200">Photo uploaded successfully. Returns the new list of all photos.</response>
        /// <response code="400">No file provided or file type is invalid.</response>
        /// <response code="401">User is not authenticated.</response>
        /// <response code="403">User is authenticated but does not own this listing.</response>
        /// <response code="404">Listing with the specified ID was not found.</response>
        [HttpPost("{listingId}/photos")]
        [ProducesResponseType(typeof(IEnumerable<PhotoDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadPhoto(int listingId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png",".avif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only .jpg, .jpeg, .avif and .png are allowed." });
            }

            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                var allPhotoDtos = await _listingService.AddPhotoToListAsync(listingId, file, hostId);
                return Ok(allPhotoDtos); // 200
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error uploading photo: {ex.Message}" }); // 400
            }
        }

        /// <summary>
        /// Deletes a photo from a listing.
        /// </summary>
        /// <remarks>
        /// This only deletes the photo record from the database. The file in Cloudinary is not removed.
        /// Business Rules:
        /// - User must be authenticated and the owner of the listing.
        /// - If the deleted photo was the cover, the next available photo will be promoted to cover.
        /// </remarks>
        /// <param name="listingId">The unique identifier of the listing.</param>
        /// <param name="photoId">The unique identifier of the photo to delete.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">Photo was deleted successfully.</response>
        /// <response code="401">User is not authenticated.</response>
        /// <response code="403">User is authenticated but does not own this listing.</response>
        /// <response code="404">Listing or photo with the specified ID was not found.</response>
        [HttpDelete("{listingId}/photos/{photoId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePhoto(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.DeletePhotoAsync(listingId, photoId, hostId);
                return NoContent(); // 204
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
        }

        /// <summary>
        /// Sets a specific photo as the cover photo for the listing.
        /// </summary>
        /// <param name="listingId">The ID of the listing.</param>
        /// <param name="photoId">The ID of the photo to set as cover.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">The cover photo was set successfully.</response>
        /// <response code="401">If the user is not authenticated.</response>
        /// <response code="403">If the authenticated user does not own this listing.</response>
        /// <response code="404">If the listing or photo is not found.</response>
        [HttpPut("{listingId}/photos/{photoId}/set-cover")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SetCoverPhoto(int listingId, int photoId)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.SetCoverPhotoAsync(listingId, photoId, hostId);
                return NoContent(); // 204
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); // 404
            }
            catch (AccessViolationException)
            {
                return Forbid(); // 403
            }
        }



        [HttpPost("{id}/publish")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> PublishListing(int id)
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(hostId)) return Unauthorized();

            try
            {
                await _listingService.PublishListingAsync(id, hostId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message }); // 400 if incomplete
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
