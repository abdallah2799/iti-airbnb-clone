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

        private bool CanPublish(Listing listing)
        {
            // Check all text fields are present
            bool hasTextData = !string.IsNullOrWhiteSpace(listing.Title)
                && !string.IsNullOrWhiteSpace(listing.Address)
                && !string.IsNullOrWhiteSpace(listing.City)
                && !string.IsNullOrWhiteSpace(listing.Country)
                && listing.PricePerNight > 0
                && listing.MaxGuests > 0
                && listing.NumberOfBedrooms > 0;
            // Note: Bedrooms > 0 might block Studios (which have 0 bedrooms). 
            // If you allow studios, change to >= 0.

            // Check photos (Must have at least 1)
            bool hasPhotos = listing.Photos != null && listing.Photos.Any();

            return hasTextData && hasPhotos;
        }

        private async Task ValidateListingStatus(int listingId)
        {
            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);
            if (listing == null) return;

            bool isValid = CanPublish(listing);

            // ONLY DEMOTE: If it's currently Published but became invalid (e.g. deleted photos), make it Draft.
            // WE DO NOT AUTO-PROMOTE TO PUBLISHED ANYMORE.
            if (!isValid && listing.Status == ListingStatus.Published)
            {
                listing.Status = ListingStatus.Draft;
                listing.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CompleteAsync();
            }
        }

        public async Task<bool> PublishListingAsync(int listingId, string hostId)
        {
            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);
            if (listing == null) throw new KeyNotFoundException("Listing not found");
            if (listing.HostId != hostId) throw new AccessViolationException("Unauthorized");

            if (!CanPublish(listing))
            {
                throw new InvalidOperationException("Listing is incomplete. Please add photos and missing details.");
            }

            listing.Status = ListingStatus.Published;
            listing.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();
            return true;
        }


        public async Task<int> CreateListingAsync(CreateListingDto listingDto, string hostId)
        {
            var listing = _mapper.Map<Listing>(listingDto);
            listing.HostId = hostId;
            listing.Status = ListingStatus.Draft; // Always start as draft
            listing.CreatedAt = DateTime.UtcNow;

            await _unitOfWork.Listings.AddAsync(listing);
            await _unitOfWork.CompleteAsync();

            return listing.Id;
        }

        public async Task UpdateListingStatusAsync(int listingId)
        {
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null) throw new Exception("Listing not found");

            listing.Status = CanPublish(listing)
                ? ListingStatus.Published
                : ListingStatus.Draft;

            listing.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();
        }




        public async Task<IEnumerable<ListingDetailsDto>> GetAllHostListingsAsync(string hostId)
        {
            var listings = await _unitOfWork.Listings.GetHostListingsAsync(hostId);
            return _mapper.Map<IEnumerable<ListingDetailsDto>>(listings);
        }


        public async Task<ListingDetailsDto?> GetListingByIdAsync(int id, string hostId)
        {
            // 1. Get the entity from the database
            // We use the specific IListingRepository from our IUnitOfWork
            var listing = await _unitOfWork.Listings.GetListingWithDetailsandBookingsAsync(id);
            // 2. Check if it was found
            if (listing == null)
            {
                return null;
            }
            if (listing.HostId != hostId)
            {
                throw new AccessViolationException("You do not own this listing.");
            }

            // 3. Map the entity to our DTO
            var listingDto = _mapper.Map<ListingDetailsDto>(listing);

            // 4. Return the DTO
            return listingDto;
        }


        public async Task<IEnumerable<PhotoDto>> AddPhotoToListAsync(int listingId, IFormFile file, string hostId)
        {
            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);
            if (listing == null) throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            if (listing.HostId != hostId) throw new AccessViolationException("You do not own this listing.");

            var photoUrl = await _photoService.UploadPhotoAsync(file);

            var photo = new Photo
            {
                Url = photoUrl,
                ListingId = listingId,
                IsCover = !listing.Photos.Any()
            };

            await _unitOfWork.Photos.AddAsync(photo);
            await _unitOfWork.CompleteAsync();

            // --- FIX: RE-CHECK STATUS AFTER UPLOAD ---
            // If this was the first photo, this will Publish the listing
            await ValidateListingStatus(listingId);

            var updatedPhotos = await _unitOfWork.Photos.GetPhotosForListingAsync(listingId);
            return _mapper.Map<IEnumerable<PhotoDto>>(updatedPhotos);
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

        public async Task<bool> UpdateListingAsync(int listingId, UpdateListingDto listingDto, string hostId)
        {
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null) throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            if (listing.HostId != hostId) throw new AccessViolationException("You do not own this listing.");

            _mapper.Map(listingDto, listing);
            listing.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();

            // --- FIX: RE-CHECK STATUS AFTER UPDATE ---
            // If user cleared the Title, this will revert status to Draft
            await ValidateListingStatus(listingId);

            return true;
        }

        public async Task<PhotoDto?> GetPhotoByIdAsync(int listingId, int photoId, string hostId)
        {
            // 1. Verify ownership
            await CheckListingOwnership(listingId, hostId);

            // 2. Get the photo
            var photo = await _unitOfWork.Photos.GetByIdAsync(photoId);

            // 3. Verify photo is not null and belongs to the correct listing
            if (photo == null || photo.ListingId != listingId)
            {
                throw new KeyNotFoundException($"Photo with ID {photoId} not found for this listing.");
            }

            return _mapper.Map<PhotoDto>(photo);
        }

        // --- DELETE PHOTO' ---
        public async Task<bool> DeletePhotoAsync(int listingId, int photoId, string hostId)
        {
            await CheckListingOwnership(listingId, hostId);

            var photo = await _unitOfWork.Photos.GetByIdAsync(photoId);
            if (photo == null || photo.ListingId != listingId)
            {
                throw new KeyNotFoundException($"Photo with ID {photoId} not found.");
            }

            _unitOfWork.Photos.Remove(photo);
            await _unitOfWork.CompleteAsync();

            // Handle Cover Photo logic if we deleted the cover
            if (photo.IsCover)
            {
                var remainingPhotos = await _unitOfWork.Photos.GetPhotosForListingAsync(listingId);
                var newCover = remainingPhotos.FirstOrDefault();
                if (newCover != null)
                {
                    newCover.IsCover = true;
                    await _unitOfWork.CompleteAsync();
                }
            }

            // --- FIX: RE-CHECK STATUS AFTER DELETE ---
            // If this was the last photo, this will Revert to Draft
            await ValidateListingStatus(listingId);

            return true;
        }

        // --- ADD 'SET COVER PHOTO' ---
        public async Task<bool> SetCoverPhotoAsync(int listingId, int photoId, string hostId)
        {
            // 1. Verify ownership
            await CheckListingOwnership(listingId, hostId);

            // 2. Get all photos for the listing
            var photos = await _unitOfWork.Photos.GetPhotosForListingAsync(listingId);
            if (!photos.Any())
            {
                throw new KeyNotFoundException("No photos found for this listing.");
            }

            // 3. Find the current cover and the new cover
            var currentCover = photos.FirstOrDefault(p => p.IsCover);
            var newCover = photos.FirstOrDefault(p => p.Id == photoId);

            if (newCover == null)
            {
                throw new KeyNotFoundException($"Photo with ID {photoId} not found for this listing.");
            }

            // 4. Update and save
            if (currentCover != null)
            {
                currentCover.IsCover = false;
            }
            newCover.IsCover = true;

            await _unitOfWork.CompleteAsync();
            return true;
        }

        // --- ADD A HELPER METHOD TO AVOID REPEATING CODE ---
        private async Task CheckListingOwnership(int listingId, string hostId)
        {
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null)
            {
                throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            }
            if (listing.HostId != hostId)
            {
                throw new AccessViolationException("You do not own this listing.");
            }
        }

        public async Task<bool> DeleteListingAsync(int listingId, string hostId)
        {
            // 1. Get the existing listing from the database
            var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
            if (listing == null)
            {
                throw new KeyNotFoundException($"Listing with ID {listingId} not found.");
            }

            // 2. Verify the host owns this listing
            if (listing.HostId != hostId)
            {
                throw new AccessViolationException("You do not own this listing.");
            }

            // 3. Delete the listing
            // (This will also delete all related Photos, Bookings, etc.,
            // if cascade delete is enabled in the database)
            _unitOfWork.Listings.Remove(listing); // Or .Remove(listing) depending on your repo

            // 4. Save the changes to the database
            await _unitOfWork.CompleteAsync();
            return true;
        }

    }
}