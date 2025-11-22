using Application.DTOs.HostBookings; // Needed for HostBookingDto
using Application.DTOs.HostListings; // Needed for ListingDetailsDto, PhotoDto, etc.
using Application.DTOs.Listing;
using AutoMapper;
using Core.Entities;

namespace AirbnbClone.Application.Helpers
{
    public class HostListingMappingProfile : Profile
    {
        public HostListingMappingProfile()
        {
            // --- Existing Map ---
            CreateMap<ApplicationUser, HostInfoDto>()
                .ForMember(dest => dest.ResponseRate, opt => opt.MapFrom(src => src.HostResponseRate))
                .ForMember(dest => dest.ResponseTimeMinutes, opt => opt.MapFrom(src => src.HostResponseTimeMinutes));


            // 1. Map Photo Entity -> PhotoDto
            CreateMap<Photo, PhotoDto>();

            // 2. Map Review Entity -> ReviewDto
            // (Note: This will use the ApplicationUser -> GuestDto map from your other profile automatically)
            CreateMap<Review, HostReviewDto>();

            // 3. Map Create/Update DTOs to Entity
            CreateMap<CreateListingDto, Listing>();
            CreateMap<UpdateListingDto, Listing>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // 4. Map Listing Entity -> ListingDetailsDto (The Complete View)
            CreateMap<Listing, ListingDetailsDto>()
                // Map the list of photos
                .ForMember(dest => dest.Photos, opt => opt.MapFrom(src => src.Photos))
                // Map the list of bookings (Uses map from HostBookingMappingProfile)
                .ForMember(dest => dest.Bookings, opt => opt.MapFrom(src => src.Bookings))
                // Map the list of reviews
                .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src => src.Reviews));
        }
    }
}