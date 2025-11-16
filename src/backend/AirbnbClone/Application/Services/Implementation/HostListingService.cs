using Application.DTOs.HostListings;
using Application.Services.Implementation;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http; 
using System.Security.AccessControl;

namespace Application.Services.Implementations
{
    public class HostListingService : IHostListingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IPhotoService _photoService;

        public HostListingService(IUnitOfWork unitOfWork, IMapper mapper, IPhotoService photoService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _photoService = photoService;
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


        public async Task<IEnumerable<PhotoDto>> AddPhotoToListAsync(int listingId, IFormFile file, string hostId)
        {
            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);

            if (listing == null)
            {
                throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            }

            if (listing.HostId != hostId)
            {
                throw new AccessViolationException("You do not own this listing.");
            }

            var photoUrl = await _photoService.UploadPhotoAsync(file);

            var photo = new Photo
            {
                Url = photoUrl,
                ListingId = listingId,
                IsCover = !listing.Photos.Any()
            };

            await _unitOfWork.Photos.AddAsync(photo);
            await _unitOfWork.CompleteAsync();

            
            return _mapper.Map<IEnumerable<PhotoDto>>(listing.Photos);
        }

        public async Task<IEnumerable<PhotoDto>> GetPhotosForListingAsync(int listingId, string hostId)
        {
            // 1. Check if the listing exists and is owned by the host
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null)
            {
                throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            }

            if (listing.HostId != hostId)
            {
                throw new AccessViolationException("You do not own this listing.");
            }

            // 2. Get the photos from the repository
            var photos = await _unitOfWork.Photos.GetPhotosForListingAsync(listingId);

            // 3. Map them to DTOs and return
            return _mapper.Map<IEnumerable<PhotoDto>>(photos);
        }
    }
}