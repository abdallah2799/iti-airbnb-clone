using AutoMapper;
using Core.Entities;
using Application.DTOs.Listing;

namespace AirbnbClone.Application.Helpers
{
    public class PhotoAmenityReviewMappingProfile : Profile
    {
        public PhotoAmenityReviewMappingProfile()
        {
            CreateMap<Photo, PhotoguestDto>();
            CreateMap<Photo, PhotoDto>();
            CreateMap<Amenity, AmenityDto>();
            CreateMap<Review, ReviewSummaryDto>()
                .ForMember(dest => dest.GuestName,
                    opt => opt.MapFrom(src => src.Guest.FullName ?? src.Guest.Email ?? "Anonymous"))
                .ForMember(dest => dest.GuestProfilePicture,
                    opt => opt.MapFrom(src => src.Guest.ProfilePictureUrl));
        }
    }
}
