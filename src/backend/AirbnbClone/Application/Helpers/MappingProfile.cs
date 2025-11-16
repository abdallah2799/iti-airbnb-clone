using AutoMapper;
using Application.DTOs;
using Core.Entities;

namespace AirbnbClone.Application.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName ?? string.Empty));
        }
    }
}
