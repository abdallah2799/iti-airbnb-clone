using AutoMapper;
using Core.Entities;
using Application.DTOs.HostListings;
using Application.DTOs.Listing;

namespace AirbnbClone.Application.Helpers
{
    public class HostListingMappingProfile : Profile
    {
        public HostListingMappingProfile()
        {
            // HostListing mappings can be added here if needed
            CreateMap<ApplicationUser, HostInfoDto>()
                .ForMember(dest => dest.ResponseRate, opt => opt.MapFrom(src => src.HostResponseRate))
                .ForMember(dest => dest.ResponseTimeMinutes, opt => opt.MapFrom(src => src.HostResponseTimeMinutes));
        }
    }
}
