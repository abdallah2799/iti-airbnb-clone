using Application.DTOs;
using Application.DTOs.HostListings;
using Application.DTOs.Listing;
using Application.DTOs.Messaging;
using AutoMapper;
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


            // Conversation to ConversationDto
            CreateMap<Conversation, ConversationDto>()
                .ForMember(dest => dest.GuestName,
                    opt => opt.MapFrom(src => src.Guest.FullName ?? src.Guest.Email ?? "Guest"))
                .ForMember(dest => dest.GuestProfilePicture,
                    opt => opt.MapFrom(src => src.Guest.ProfilePictureUrl))
                .ForMember(dest => dest.HostName,
                    opt => opt.MapFrom(src => src.Host.FullName ?? src.Host.Email ?? "Host"))
                .ForMember(dest => dest.HostProfilePicture,
                    opt => opt.MapFrom(src => src.Host.ProfilePictureUrl))
                .ForMember(dest => dest.ListingTitle,
                    opt => opt.MapFrom(src => src.Listing.Title))
                .ForMember(dest => dest.ListingCoverPhoto,
                    opt => opt.MapFrom(src => src.Listing.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? src.Listing.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : src.Listing.Photos.FirstOrDefault() != null ? src.Listing.Photos.FirstOrDefault()!.Url : null))
                .ForMember(dest => dest.LastMessageContent, opt => opt.Ignore())
                .ForMember(dest => dest.LastMessageTimestamp, opt => opt.Ignore())
                .ForMember(dest => dest.LastMessageSenderId, opt => opt.Ignore())
                .ForMember(dest => dest.UnreadCount, opt => opt.Ignore());

            // Conversation to ConversationDetailDto
            CreateMap<Conversation, ConversationDetailDto>()
                .ForMember(dest => dest.Guest, opt => opt.MapFrom(src => src.Guest))
                .ForMember(dest => dest.Host, opt => opt.MapFrom(src => src.Host))
                .ForMember(dest => dest.Listing, opt => opt.MapFrom(src => src.Listing))
                .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Messages));

            // ApplicationUser to ParticipantDto
            CreateMap<ApplicationUser, ParticipantDto>()
                .ForMember(dest => dest.Name,
                    opt => opt.MapFrom(src => src.FullName ?? src.Email ?? "User"))
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.Email ?? string.Empty))
                .ForMember(dest => dest.ProfilePictureUrl,
                    opt => opt.MapFrom(src => src.ProfilePictureUrl))
                .ForMember(dest => dest.IsOnline, opt => opt.Ignore());

            // Listing to ConversationListingDto
            CreateMap<Listing, ConversationListingDto>()
                .ForMember(dest => dest.CoverPhotoUrl,
                    opt => opt.MapFrom(src => src.Photos.FirstOrDefault(p => p.IsCover) != null
                        ? src.Photos.FirstOrDefault(p => p.IsCover)!.Url
                        : src.Photos.FirstOrDefault() != null ? src.Photos.FirstOrDefault()!.Url : null));

            // Message to MessageDto
            CreateMap<Message, MessageDto>()
                .ForMember(dest => dest.SenderName,
                    opt => opt.MapFrom(src => src.Sender.FullName ?? src.Sender.Email ?? "User"))
                .ForMember(dest => dest.SenderProfilePicture,
                    opt => opt.MapFrom(src => src.Sender.ProfilePictureUrl));

            // You can add more complex mappings here, for example:
            // .ForMember(dest => dest.HostName, opt => opt.MapFrom(src => src.Host.FullName))
            // .ForMember(dest => dest.PhotoUrls, opt => opt.MapFrom(src => src.Photos.Select(p => p.Url).ToList()));
        }
    }
    }

