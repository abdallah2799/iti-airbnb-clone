using Core.Enums;

namespace Application.DTOs.HostListings
{
    public class ListingDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal PricePerNight { get; set; }
        public int MaxGuests { get; set; }
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public PropertyType PropertyType { get; set; }
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public ListingStatus Status { get; set; }

        public string HostId { get; set; } = string.Empty;
        // public string HostName { get; set; } 

        // And the photos
        // public List<string> PhotoUrls { get; set; } = new();
    }
}