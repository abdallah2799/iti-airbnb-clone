using AutoMapper;
using Core.Entities;
using Application.DTOs.Listing;
using Application.DTOs.HostListings;
using Application.DTOs.Messaging;

namespace AirbnbClone.Application.Helpers
{
    public class ListingMappingProfile : Profile
    {
        public ListingMappingProfile()
        {
            // Listing Card mappings (for homepage grid)
            CreateMap<Listing, ListingCardDto>()
                .ForMember(dest => dest.CoverPhotoUrl,
                    opt => opt.MapFrom(src => src.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? src.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : src.Photos.FirstOrDefault() != null ? src.Photos.FirstOrDefault()!.Url : null))
                .ForMember(dest => dest.AverageRating,
                    opt => opt.MapFrom(src => src.Reviews.Any() ? src.Reviews.Average(r => r.Rating) : 0))
                .ForMember(dest => dest.ReviewCount,
                    opt => opt.MapFrom(src => src.Reviews.Count))
                .ForMember(dest => dest.HostName,
                    opt => opt.MapFrom(src => src.Host.FullName ?? src.Host.Email ?? "Unknown Host"))
                .ForMember(dest => dest.IsSuperHost,
                    opt => opt.MapFrom(src => false)); // TODO: Implement SuperHost logic

            // Listing Detail mappings
            CreateMap<Listing, ListingDetailDto>()
                .ForMember(dest => dest.Photos,
                    opt => opt.MapFrom(src => src.Photos))
                .ForMember(dest => dest.Amenities,
                    opt => opt.MapFrom(src => src.ListingAmenities.Select(la => la.Amenity)))
                .ForMember(dest => dest.Reviews,
                    opt => opt.MapFrom(src => src.Reviews))
                .ForMember(dest => dest.AverageRating,
                    opt => opt.MapFrom(src => src.Reviews.Any() ? src.Reviews.Average(r => r.Rating) : 0))
                .ForMember(dest => dest.ReviewCount,
                    opt => opt.MapFrom(src => src.Reviews.Count))
                .ForMember(dest => dest.Host,
                    opt => opt.MapFrom(src => src.Host));

            //CreateMap<CreateListingDto, Listing>();

            //CreateMap<Listing, ListingDetailsDto>();
            
            //CreateMap<UpdateListingDto, Listing>();
            
        }
    }
}
