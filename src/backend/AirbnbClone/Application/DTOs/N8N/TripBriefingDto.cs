namespace Application.DTOs.N8n
{
    public class TripBriefingDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        public double? Longitude { get; set; }= 0;
        public double? Latitude { get; set; }= 0;

        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public string ListingTitle { get; set; } = string.Empty;
        public string ListingAddress { get; set; } = string.Empty;
        
        // We send the "Internal Knowledge" so n8n can use it in the prompt
        public string HouseRules { get; set; } = string.Empty; 
        public string HostName { get; set; } = string.Empty;
    }
}

