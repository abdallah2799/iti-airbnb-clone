using Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.HostListings
{
    public class HostUpdateListingDto
    {
        //[Required]
        [MaxLength(100)]
        public string? Title { get; set; } = string.Empty;

        [MaxLength(5000)]
        public string? Description { get; set; } = string.Empty;

        [Range(0, 100000)]
        public decimal? PricePerNight { get; set; }

        public string? Address { get; set; } = string.Empty;

        public string? City { get; set; } = string.Empty;

        public string? Country { get; set; } = string.Empty;

        [Range(1, 100)]
        public int? MaxGuests { get; set; }

        [Range(1, 50)]
        public int? NumberOfBedrooms { get; set; }

        [Range(1, 50)]
        public int? NumberOfBathrooms { get; set; }

        public PropertyType? PropertyType { get; set; }
        public PrivacyType? PrivacyType { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public decimal? CleaningFee { get; set; }
        public int? MinimumNights { get; set; }
        public bool InstantBooking { get; set; } = false;

        public List<int>? AmenityIds { get; set; }
    }
}