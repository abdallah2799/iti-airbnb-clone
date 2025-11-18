using Application.DTOs;
using Application.DTOs.Listing;

using AutoMapper;
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

            // Photo mappings
            CreateMap<Photo, PhotoguestDto>();

            // Amenity mappings
            CreateMap<Amenity, AmenityDto>();

            // Review mappings
            CreateMap<Review, ReviewSummaryDto>()
                .ForMember(dest => dest.GuestName,
                    opt => opt.MapFrom(src => src.Guest.FullName ?? src.Guest.Email ?? "Anonymous"))
                .ForMember(dest => dest.GuestProfilePicture,
                    opt => opt.MapFrom(src => src.Guest.ProfilePictureUrl));

            // Host Info mappings
            CreateMap<ApplicationUser, HostInfoDto>()
                .ForMember(dest => dest.ResponseRate,
                    opt => opt.MapFrom(src => src.HostResponseRate))
                .ForMember(dest => dest.ResponseTimeMinutes,
                    opt => opt.MapFrom(src => src.HostResponseTimeMinutes));
            CreateMap<CreateListingDto, Listing>();
            CreateMap<Listing, ListingDetailsDto>();
            CreateMap<Photo, PhotoDto>();
            CreateMap<UpdateListingDto, Listing>();

            // You can add more complex mappings here, for example:
            // .ForMember(dest => dest.HostName, opt => opt.MapFrom(src => src.Host.FullName))
            // .ForMember(dest => dest.PhotoUrls, opt => opt.MapFrom(src => src.Photos.Select(p => p.Url).ToList()));
        }
    }
    }

