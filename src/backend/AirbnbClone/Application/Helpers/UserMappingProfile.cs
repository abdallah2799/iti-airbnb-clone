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
        }
    }
}
