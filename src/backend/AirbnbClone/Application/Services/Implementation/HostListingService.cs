using Application.DTOs.HostListings;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories;

namespace Application.Services.Implementations
{
    public class HostListingService : IHostListingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public HostListingService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<int> CreateListingAsync(CreateListingDto listingDto, string hostId)
        {
            // 1. Map the DTO to the Core Entity
            var listing = _mapper.Map<Listing>(listingDto);

            // 2. Set server-side properties not included in the DTO
            listing.HostId = hostId;

            // Your Listing.cs entity already defaults these,
            // but being explicit is good practice.
            listing.Status = ListingStatus.Draft;
            listing.CreatedAt = DateTime.UtcNow;

            // 3. Add the new listing to the repository
            // We use the IListingRepository exposed by our Unit of Work
            // The IListingRepository inherits AddAsync from IRepository<T>
            await _unitOfWork.Listings.AddAsync(listing);

            // 4. Save all changes to the database
            await _unitOfWork.CompleteAsync();

            // 5. Return the new listing's ID
            return listing.Id;
        }


        public async Task<ListingDetailsDto?> GetListingByIdAsync(int id)
        {
            // 1. Get the entity from the database
            // We use the specific IListingRepository from our IUnitOfWork
            // (You already provided this method in IListingRepository.cs)
            var listing = await _unitOfWork.Listings.GetByIdAsync(id); // or GetListingWithDetailsAsync(id)

            // 2. Check if it was found
            if (listing == null)
            {
                return null;
            }

            // 3. Map the entity to our DTO
            var listingDto = _mapper.Map<ListingDetailsDto>(listing);

            // 4. Return the DTO
            return listingDto;
        }
    }
}
