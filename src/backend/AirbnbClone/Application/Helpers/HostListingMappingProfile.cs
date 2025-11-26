using Application.DTOs.HostBookings; 
using Application.DTOs.HostListings; 
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
            CreateMap<HostCreateListingDto, Listing>();
            CreateMap<HostUpdateListingDto, Listing>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Amenity, HostAmenityDto>();

            // 4. Map Listing Entity -> ListingDetailsDto 
            CreateMap<Listing, HostListingDetailsDto>()
                .ForMember(dest => dest.Photos, opt => opt.MapFrom(src => src.Photos))
                .ForMember(dest => dest.Bookings, opt => opt.MapFrom(src => src.Bookings))
                .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src => src.Reviews))
                .ForMember(dest => dest.Amenities, opt => opt.MapFrom(src => src.ListingAmenities.Select(la => la.Amenity)));
        }
    }
}