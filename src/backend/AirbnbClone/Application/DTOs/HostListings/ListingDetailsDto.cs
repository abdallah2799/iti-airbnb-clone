using Core.Enums;
using System.ComponentModel.DataAnnotations;
using Application.DTOs.HostBookings;

namespace Application.DTOs.HostListings
{
    public class ListingDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal PricePerNight { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public int MaxGuests { get; set; }
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public PropertyType PropertyType { get; set; }
        public PrivacyType PrivacyType { get; set; }
        public ListingStatus Status { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool InstantBooking { get; set; }


        public ICollection<PhotoDto> Photos { get; set; }
        public ICollection<HostBookingDto> Bookings { get; set; } = new List<HostBookingDto>();
        public ICollection<HostReviewDto> Reviews { get; set; } = new List<HostReviewDto>();
    }
}