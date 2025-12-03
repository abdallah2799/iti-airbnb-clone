using Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Interfaces
{
    public interface IWishlistRepository
    {
        Task<UserWishlist?> GetWishlistItemAsync(string userId, int listingId);
        Task<IEnumerable<UserWishlist>> GetUserWishlistAsync(string userId);
        Task<IEnumerable<int>> GetUserWishlistIdsAsync(string userId);
        Task AddToWishlistAsync(UserWishlist wishlistItem);
        Task RemoveFromWishlistAsync(UserWishlist wishlistItem);
        Task<bool> IsInWishlistAsync(string userId, int listingId);
        Task<int> GetWishlistCountAsync(string userId);
    }
}


