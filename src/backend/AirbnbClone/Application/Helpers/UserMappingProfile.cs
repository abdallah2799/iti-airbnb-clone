using AutoMapper;
using Core.Entities;
using Application.DTOs;

namespace AirbnbClone.Application.Helpers
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName ?? string.Empty));
            CreateMap<ApplicationUser, HostInfoDto>()
                .ForMember(dest => dest.ResponseRate, opt => opt.MapFrom(src => src.HostResponseRate))
                .ForMember(dest => dest.ResponseTimeMinutes, opt => opt.MapFrom(src => src.HostResponseTimeMinutes));
            CreateMap<ApplicationUser, ParticipantDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.FullName ?? src.Email ?? "User"))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email ?? string.Empty))
                .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => src.ProfilePictureUrl))
                .ForMember(dest => dest.IsOnline, opt => opt.Ignore());
        }
    }
}
