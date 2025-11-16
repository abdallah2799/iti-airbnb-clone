using AutoMapper;
using Application.DTOs;
using Core.Entities;
using Application.DTOs.HostListings;

namespace AirbnbClone.Application.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName ?? string.Empty));
            CreateMap<CreateListingDto, Listing>();
            CreateMap<Listing, ListingDetailsDto>();
            // You can add more complex mappings here, for example:
            // .ForMember(dest => dest.HostName, opt => opt.MapFrom(src => src.Host.FullName))
            // .ForMember(dest => dest.PhotoUrls, opt => opt.MapFrom(src => src.Photos.Select(p => p.Url).ToList()));
        }
    }
    }

