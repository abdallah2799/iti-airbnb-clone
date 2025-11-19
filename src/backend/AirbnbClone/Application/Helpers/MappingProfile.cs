
// This file is now split into multiple mapping profiles:
// - UserMappingProfile
// - ListingMappingProfile
// - HostListingMappingProfile
// - MessagingMappingProfile
// - PhotoAmenityReviewMappingProfile
using AutoMapper;
using Core.Entities;
using Application.DTOs;
using Application.DTOs.HostListings;


namespace AirbnbClone.Application.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
           
            CreateMap<Review, ReviewDto>()
                 .ForMember(dest => dest.GuestName,
                     opt => opt.MapFrom(src => src.Guest != null ? src.Guest.FullName ?? src.Guest.UserName : "Unknown User"))
                 .ForMember(dest => dest.GuestAvatar,
                     opt => opt.MapFrom(src => src.Guest != null ? src.Guest.ProfilePictureUrl ?? string.Empty : string.Empty));

            CreateMap<CreateReviewDto, Review>();
        }
    }
    }

