using AutoMapper;
using Core.Entities;
using Application.DTOs.Listing;
using Application.DTOs.HostListings;    

namespace AirbnbClone.Application.Helpers
{
    public class PhotoAmenityReviewMappingProfile : Profile
    {
        public PhotoAmenityReviewMappingProfile()
        {
            CreateMap<Photo, PhotoguestDto>();
            CreateMap<Photo, PhotoDto>();
            CreateMap<Amenity, AmenityDto>();
            CreateMap<ApplicationUser, global::Application.DTOs.GuestDto>();
            CreateMap<Review, ReviewSummaryDto>()
                .ForMember(dest => dest.Guest, opt => opt.MapFrom(src => src.Guest));
        }
    }
}


