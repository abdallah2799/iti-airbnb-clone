using Application.DTOs.Wishlist;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Implementation
{
    public class WishlistService : IWishlistService
    {
        private readonly IWishlistRepository _wishlistRepository;
        private readonly IListingRepository _listingRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public WishlistService(
            IWishlistRepository wishlistRepository,
            IListingRepository listingRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _wishlistRepository = wishlistRepository;
            _listingRepository = listingRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<WishlistItemDto>> GetUserWishlistAsync(string userId)
        {
            var wishlistItems = await _wishlistRepository.GetUserWishlistAsync(userId);
            return _mapper.Map<IEnumerable<WishlistItemDto>>(wishlistItems);
        }

        public async Task<WishlistResponseDto> AddToWishlistAsync(string userId, AddToWishlistDto addToWishlistDto)
        {
            // Check if listing exists
            var listing = await _listingRepository.GetByIdAsync(addToWishlistDto.ListingId);
            if (listing == null)
            {
                return new WishlistResponseDto
                {
                    Success = false,
                    Message = "Listing not found",
                    IsInWishlist = false
                };
            }

            // Check if already in wishlist
            var existingItem = await _wishlistRepository.GetWishlistItemAsync(userId, addToWishlistDto.ListingId);
            if (existingItem != null)
            {
                return new WishlistResponseDto
                {
                    Success = false,
                    Message = "Listing is already in your wishlist",
                    IsInWishlist = true
                };
            }

            // Add to wishlist
            var wishlistItem = new UserWishlist
            {
                ApplicationUserId = userId,
                ListingId = addToWishlistDto.ListingId
            };

            await _wishlistRepository.AddToWishlistAsync(wishlistItem);
            await _unitOfWork.CompleteAsync(); // Use UnitOfWork to save changes

            return new WishlistResponseDto
            {
                Success = true,
                Message = "Added to wishlist",
                IsInWishlist = true
            };
        }

        public async Task<WishlistResponseDto> RemoveFromWishlistAsync(string userId, int listingId)
        {
            var wishlistItem = await _wishlistRepository.GetWishlistItemAsync(userId, listingId);
            if (wishlistItem == null)
            {
                return new WishlistResponseDto
                {
                    Success = false,
                    Message = "Listing not found in wishlist",
                    IsInWishlist = false
                };
            }

            await _wishlistRepository.RemoveFromWishlistAsync(wishlistItem);
            await _unitOfWork.CompleteAsync(); // Use UnitOfWork to save changes

            return new WishlistResponseDto
            {
                Success = true,
                Message = "Removed from wishlist",
                IsInWishlist = false
            };
        }

        public async Task<bool> IsInWishlistAsync(string userId, int listingId)
        {
            return await _wishlistRepository.IsInWishlistAsync(userId, listingId);
        }

        public async Task<int> GetWishlistCountAsync(string userId)
        {
            return await _wishlistRepository.GetWishlistCountAsync(userId);
        }
    }
}
