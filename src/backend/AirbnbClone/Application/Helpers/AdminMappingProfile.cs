using Application.DTOs.Admin;
using AutoMapper;
using Core.Entities;
using Core.Enums;

namespace AirbnbClone.Application.Helpers;

public class AdminMappingProfile : Profile
{
    public AdminMappingProfile()
    {
        // User ? AdminUserDto
        CreateMap<ApplicationUser, AdminUserDto>()
            .ForMember(dest => dest.Roles, opt => opt.Ignore()) // We'll set this manually in service
            .ForMember(dest => dest.IsSuspended, opt => opt.MapFrom(src => !src.EmailConfirmed)); // or use a custom flag

        // Listing ? AdminListingDto
        CreateMap<Listing, AdminListingDto>()
            .ForMember(dest => dest.HostFullName, opt => opt.MapFrom(src => src.Host.FullName ?? string.Empty))
            .ForMember(dest => dest.HostEmail, opt => opt.MapFrom(src => src.Host.Email ?? string.Empty));

        // Booking ? AdminBookingDto
        CreateMap<Booking, AdminBookingDto>()
            .ForMember(dest => dest.GuestEmail, opt => opt.MapFrom(src => src.Guest.Email ?? string.Empty))
            .ForMember(dest => dest.GuestFullName, opt => opt.MapFrom(src => src.Guest.FullName ?? string.Empty))
            .ForMember(dest => dest.ListingTitle, opt => opt.MapFrom(src => src.Listing.Title))
            .ForMember(dest => dest.HostId, opt => opt.MapFrom(src => src.Listing.HostId))
            .ForMember(dest => dest.HostEmail, opt => opt.MapFrom(src => src.Listing.Host.Email ?? string.Empty))
            .ForMember(dest => dest.HostFullName, opt => opt.MapFrom(src => src.Listing.Host.FullName ?? string.Empty));
    }
}

