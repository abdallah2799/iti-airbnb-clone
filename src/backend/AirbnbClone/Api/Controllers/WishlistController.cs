using Application.DTOs.Wishlist;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var wishlist = await _wishlistService.GetUserWishlistAsync(userId);
            return Ok(wishlist);
        }

        [HttpPost]
        public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistDto addToWishlistDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _wishlistService.AddToWishlistAsync(userId, addToWishlistDto);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("{listingId}")]
        public async Task<IActionResult> RemoveFromWishlist(int listingId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _wishlistService.RemoveFromWishlistAsync(userId, listingId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("check/{listingId}")]
        public async Task<IActionResult> CheckInWishlist(int listingId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var isInWishlist = await _wishlistService.IsInWishlistAsync(userId, listingId);
            return Ok(new { isInWishlist });
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetWishlistCount()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var count = await _wishlistService.GetWishlistCountAsync(userId);
            return Ok(new { count });
        }
    }
}

