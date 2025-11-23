using AutoMapper;
using Core.Entities;
using Application.DTOs;
using Application.DTOs.Listing;
using Application.DTOs.Messaging;

namespace AirbnbClone.Application.Helpers
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName ?? string.Empty));
            CreateMap<Review, ReviewDto>()
                 .ForMember(dest => dest.GuestName,
                     opt => opt.MapFrom(src => src.Guest != null ? src.Guest.FullName ?? src.Guest.UserName : "Unknown User"))
                 .ForMember(dest => dest.GuestAvatar,
                     opt => opt.MapFrom(src => src.Guest != null ? src.Guest.ProfilePictureUrl ?? string.Empty : string.Empty));

            CreateMap<CreateReviewDto, Review>();
            CreateMap<ApplicationUser, ProfileDto>();
        }
    }
}
