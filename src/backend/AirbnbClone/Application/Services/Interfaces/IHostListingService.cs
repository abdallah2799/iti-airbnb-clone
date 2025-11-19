using Application.DTOs.HostListings;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services.Interfaces
{
    public interface IHostListingService
    {
        /// <summary>
        /// Creates a new listing for a specific host.
        /// </summary>
        /// <param name="listingDto">The data for the new listing.</param>
        /// <param name="hostId">The ID of the user creating the listing.</param>
        /// <returns>The ID of the newly created listing.</returns>
        Task<int> CreateListingAsync(CreateListingDto listingDto, string hostId);

        Task<ListingDetailsDto?> GetListingByIdAsync(int id, string hostId);
        Task<IEnumerable<PhotoDto>> AddPhotoToListAsync(int listingId, IFormFile file, string hostId);
        Task<IEnumerable<PhotoDto>> GetPhotosForListingAsync(int listingId, string hostId);
        Task<bool> UpdateListingAsync(int listingId, UpdateListingDto listingDto, string hostId);
        Task<PhotoDto?> GetPhotoByIdAsync(int listingId, int photoId, string hostId);
        Task<bool> DeletePhotoAsync(int listingId, int photoId, string hostId);
        Task<bool> SetCoverPhotoAsync(int listingId, int photoId, string hostId);
        Task<bool> DeleteListingAsync(int listingId, string hostId);
    }
}
