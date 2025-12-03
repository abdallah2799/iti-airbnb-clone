using Application.DTOs.Wishlist;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Interfaces
{
    public interface IWishlistService
    {
        Task<IEnumerable<WishlistItemDto>> GetUserWishlistAsync(string userId);
        Task<WishlistResponseDto> AddToWishlistAsync(string userId, AddToWishlistDto addToWishlistDto);
        Task<WishlistResponseDto> RemoveFromWishlistAsync(string userId, int listingId);
        Task<bool> IsInWishlistAsync(string userId, int listingId);
        Task<int> GetWishlistCountAsync(string userId);
        Task<IEnumerable<int>> GetUserWishlistIdsAsync(string userId);
    }
}


