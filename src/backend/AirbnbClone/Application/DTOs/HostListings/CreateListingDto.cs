using Core.Enums;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.HostListings
{
  
    public class CreateListingDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, 100000)]
        public decimal PricePerNight { get; set; }

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string Country { get; set; } = string.Empty;

        [Required]
        [Range(1, 100)]
        public int MaxGuests { get; set; }

        [Required]
        [Range(1, 50)]
        public int NumberOfBedrooms { get; set; }

        [Required]
        [Range(1, 50)]
        public int NumberOfBathrooms { get; set; }

        [Required]
        public PropertyType PropertyType { get; set; }
        [Required]
        public PrivacyType PrivacyType { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }


        public decimal? CleaningFee { get; set; }
        public int? MinimumNights { get; set; }
        public bool InstantBooking { get; set; } = false;


        
        // public List<int> AmenityIds { get; set; } = new();
    }
}