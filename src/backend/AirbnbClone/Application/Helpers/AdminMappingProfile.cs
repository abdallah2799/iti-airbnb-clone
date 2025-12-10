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
            .ForMember(dest => dest.IsSuspended, opt => opt.MapFrom(src => src.IsSuspended))
            .ForMember(dest => dest.IsConfirmed, opt => opt.MapFrom(src => src.EmailConfirmed));

        // Listing ? AdminListingDto
        CreateMap<Listing, AdminListingDto>()
            .ForMember(dest => dest.HostFullName, opt => opt.MapFrom(src => src.Host.FullName ?? string.Empty))
            .ForMember(dest => dest.HostEmail, opt => opt.MapFrom(src => src.Host.Email ?? string.Empty))
            .ForMember(dest => dest.ImageUrls, opt => opt.MapFrom(src => src.Photos.Select(p => p.Url).ToList()));

        // Booking ? AdminBookingDto
        CreateMap<Booking, AdminBookingDto>()
            .ForMember(dest => dest.GuestEmail, opt => opt.MapFrom(src => src.Guest.Email ?? string.Empty))
            .ForMember(dest => dest.GuestFullName, opt => opt.MapFrom(src => src.Guest.FullName ?? string.Empty))
            .ForMember(dest => dest.ListingTitle, opt => opt.MapFrom(src => src.Listing.Title))
            .ForMember(dest => dest.HostId, opt => opt.MapFrom(src => src.Listing.HostId))
            .ForMember(dest => dest.HostEmail, opt => opt.MapFrom(src => src.Listing.Host.Email ?? string.Empty))
            .ForMember(dest => dest.HostFullName, opt => opt.MapFrom(src => src.Listing.Host.FullName ?? string.Empty));

        CreateMap<Booking, RecentBookingDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.GuestName, opt => opt.MapFrom(src => src.Guest.FullName ?? src.Guest.UserName))
            .ForMember(dest => dest.ListingTitle, opt => opt.MapFrom(src => src.Listing.Title))
            .ForMember(dest => dest.BookingDate, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<Listing, RecentListingDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.HostName, opt => opt.MapFrom(src => src.Host.FullName ?? src.Host.UserName))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }
}

