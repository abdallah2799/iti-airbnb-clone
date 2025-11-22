using Application.DTOs.Bookings;
using AutoMapper;
using Core.Entities;
using System.Linq;

namespace AirbnbClone.Application.Helpers;

/// <summary>
/// AutoMapper profile for booking-related mappings
/// </summary>
public class BookingMappingProfile : Profile
{
    public BookingMappingProfile()
    {
        // Map Listing -> BookingListingDto (used inside BookingDetailDto)
        CreateMap<Listing, BookingListingDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.Title, o => o.MapFrom(s => s.Title ?? string.Empty))
            .ForMember(d => d.CoverPhotoUrl, o => o.MapFrom(s =>
                s.Photos != null
                    ? s.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? s.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : s.Photos.FirstOrDefault()!.Url
                    : null))
            .ForMember(d => d.HostId, o => o.MapFrom(s => s.HostId ?? string.Empty))
            .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host != null ? s.Host.FullName ?? s.Host.Email ?? string.Empty : string.Empty));

        // Map ApplicationUser -> BookingGuestDto
        CreateMap<ApplicationUser, BookingGuestDto>()
            .ForMember(d => d.GuestId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.GuestName, o => o.MapFrom(s => s.FullName ?? s.Email ?? string.Empty))
            .ForMember(d => d.GuestProfilePicture, o => o.MapFrom(s => s.ProfilePictureUrl));

        // Booking -> BookingDto (list view)
        CreateMap<Booking, BookingDto>()
            .ForMember(d => d.ListingId, o => o.MapFrom(s => s.ListingId))
            .ForMember(d => d.ListingTitle, o => o.MapFrom(s => s.Listing != null ? s.Listing.Title ?? string.Empty : string.Empty))
            .ForMember(d => d.ListingCoverPhoto, o => o.MapFrom(s =>
                s.Listing != null && s.Listing.Photos != null
                    ? s.Listing.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? s.Listing.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : s.Listing.Photos.FirstOrDefault()!.Url
                    : null))
            .ForMember(d => d.HostId, o => o.MapFrom(s => s.Listing != null ? s.Listing.HostId : string.Empty))
            .ForMember(d => d.HostName, o => o.MapFrom(s => s.Listing != null && s.Listing.Host != null ? s.Listing.Host.FullName ?? s.Listing.Host.Email ?? string.Empty : string.Empty))
            .ForMember(d => d.Currency, o => o.MapFrom(s => s.Listing != null ? s.Listing.Currency : "EGP"));

        // Booking -> BookingDetailDto (detailed view)
        CreateMap<Booking, BookingDetailDto>()
            // let AutoMapper map nested objects using the maps above
            .ForMember(d => d.Listing, o => o.MapFrom(s => s.Listing))
            .ForMember(d => d.Guest, o => o.MapFrom(s => s.Guest))
            .ForMember(d => d.StartDate, o => o.MapFrom(s => s.StartDate))
            .ForMember(d => d.EndDate, o => o.MapFrom(s => s.EndDate))
            .ForMember(d => d.Guests, o => o.MapFrom(s => s.Guests))
            .ForMember(d => d.TotalPrice, o => o.MapFrom(s => s.TotalPrice))
            .ForMember(d => d.CleaningFee, o => o.MapFrom(s => s.CleaningFee))
            .ForMember(d => d.ServiceFee, o => o.MapFrom(s => s.ServiceFee))
            .ForMember(d => d.Currency, o => o.MapFrom(s => s.Listing != null ? s.Listing.Currency : "EGP"))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status))
            .ForMember(d => d.PaymentStatus, o => o.MapFrom(s => s.PaymentStatus))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.CreatedAt))
            .ForMember(d => d.CancellationReason, o => o.MapFrom(s => s.CancellationReason))
            .ForMember(d => d.CancelledAt, o => o.MapFrom(s => s.CancelledAt))
            .ForMember(d => d.RefundAmount, o => o.MapFrom(s => s.RefundAmount))
            .ForMember(d => d.RefundedAt, o => o.MapFrom(s => s.RefundedAt));
    }
}