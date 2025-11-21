using Application.DTOs.HostBookings;
using Application.DTOs.HostListings;
using Application.DTOs.Listing;
using AutoMapper;
using Core.Entities;

namespace Application.Helpers
{
    public class HostBookingMappingProfile : Profile
    {
        public HostBookingMappingProfile()
        {
            CreateMap<ApplicationUser, GuestDto>();
            CreateMap<Booking, HostBookingDto>()
    .ForMember(dest => dest.ListingTitle, opt => opt.MapFrom(src => src.Listing.Title))
    .ForMember(dest => dest.ListingImageUrl, opt => opt.MapFrom(src =>
        src.Listing.Photos.FirstOrDefault(p => p.IsCover).Url ??
        src.Listing.Photos.FirstOrDefault().Url));
        }
    }
}