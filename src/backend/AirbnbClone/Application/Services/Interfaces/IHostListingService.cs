using Application.DTOs.HostListings;
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

        Task<ListingDetailsDto?> GetListingByIdAsync(int id);
    }
}
