namespace AirbnbClone.Application.DTOs.AiAssistant
{
    public class GenerateDescriptionDto
    {
        public string Title { get; set; }      // e.g. "Sunny Studio in Downtown"
        public string Location { get; set; }   // e.g. "Cairo, Egypt"
        public string PropertyType { get; set; } // e.g. "Apartment"
        public List<string> Amenities { get; set; } // e.g. ["WiFi", "Pool", "Balcony"]
    }
}

