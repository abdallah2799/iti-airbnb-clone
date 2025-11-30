using Application.DTOs.Wishlist;
using AutoMapper;
using Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Helpers
{
    public class WishlistMappingProfile : Profile
    {
        public WishlistMappingProfile()
        {
            // Add to your MappingProfile.cs
            CreateMap<UserWishlist, WishlistItemDto>()
                .ForMember(dest => dest.ListingId, opt => opt.MapFrom(src => src.Listing.Id))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Listing.Title))
                .ForMember(dest => dest.CoverPhotoUrl, opt => opt.MapFrom(src =>
                    src.Listing.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? src.Listing.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : src.Listing.Photos.FirstOrDefault() != null ? src.Listing.Photos.FirstOrDefault()!.Url : null))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Listing.PricePerNight))
                .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src =>
                    src.Listing.Reviews.Any() ? src.Listing.Reviews.Average(r => r.Rating) : 0))
                .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.Listing.Reviews.Count))
                .ForMember(dest => dest.Location, opt => opt.MapFrom(src =>
                    $"{src.Listing.City}, {src.Listing.Country}"))
                .ForMember(dest => dest.AddedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        }
    }
}


