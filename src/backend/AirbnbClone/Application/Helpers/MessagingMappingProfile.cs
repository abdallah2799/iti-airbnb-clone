using AutoMapper;
using Core.Entities;
using Application.DTOs.Messaging;

namespace AirbnbClone.Application.Helpers
{
    public class MessagingMappingProfile : Profile
    {
        public MessagingMappingProfile()
        {
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

            CreateMap<Conversation, ConversationDetailDto>()
                .ForMember(dest => dest.Guest, opt => opt.MapFrom(src => src.Guest))
                .ForMember(dest => dest.Host, opt => opt.MapFrom(src => src.Host))
                .ForMember(dest => dest.Listing, opt => opt.MapFrom(src => src.Listing))
                .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Messages));

            CreateMap<Message, MessageDto>()
                .ForMember(dest => dest.SenderName,
                    opt => opt.MapFrom(src => src.Sender.FullName ?? src.Sender.Email ?? "User"))
                .ForMember(dest => dest.SenderProfilePicture,
                    opt => opt.MapFrom(src => src.Sender.ProfilePictureUrl));
        }
    }
}
