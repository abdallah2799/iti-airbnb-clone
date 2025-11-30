using Core.Enums;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.HostListings
{
  
    public class HostCreateListingDto
    {
        // [Required]
        [MaxLength(100)]
        public string? Title { get; set; } // Nullable string

        [MaxLength(5000)]
        public string? Description { get; set; }

        [Range(0, 100000)] 
        public decimal? PricePerNight { get; set; } // Nullable decimal

        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        [Range(0, 100)]
        public int? MaxGuests { get; set; } // Nullable int

        [Range(0, 50)]
        public int? NumberOfBedrooms { get; set; }

        [Range(0, 50)]
        public int? NumberOfBathrooms { get; set; }

        // Crucial: Enums must be nullable, otherwise 'null' from frontend causes 400
        public PropertyType? PropertyType { get; set; }
        public PrivacyType? PrivacyType { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public ListingStatus Status { get; set; } 

        public decimal? CleaningFee { get; set; }
        public int? MinimumNights { get; set; }
        public bool InstantBooking { get; set; } = false;


        public List<int>? AmenityIds { get; set; } = new List<int>();
    }
}

