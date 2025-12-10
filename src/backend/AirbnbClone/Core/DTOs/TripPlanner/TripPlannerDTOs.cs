using System.Text.Json.Serialization;

namespace Core.DTOs.TripPlanner
{
    // INPUT (Matches your Frontend)
    public class TripSearchCriteriaDto
    {
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string BudgetLevel { get; set; } = "medium"; // low, medium, high, luxury
        public TravelersDto Travelers { get; set; } = new();
        public List<string> Interests { get; set; } = new();
        public string Currency { get; set; } = "USD";
    }

    public class TravelersDto
    {
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
    }

    // OUTPUT (Matches your TripResponse)
    public class TripResponseDto
    {
        [JsonPropertyName("trip_overview")]
        public TripOverviewDto TripOverview { get; set; } = new();

        [JsonPropertyName("estimated_costs")]
        public EstimatedCostsDto EstimatedCosts { get; set; } = new();

        [JsonPropertyName("itinerary")]
        public List<ItineraryItemDto> Itinerary { get; set; } = new();

        [JsonPropertyName("lodging_recommendations")]
        public List<HotelRecommendationDto> LodgingRecommendations { get; set; } = new();
    }

    public class TripOverviewDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string History { get; set; } = string.Empty;
        public GeoCoordinatesDto Coordinates { get; set; } = new();
    }

    public class EstimatedCostsDto
    {
        public decimal Accommodation { get; set; }
        public decimal Transportation { get; set; }
        public decimal Food { get; set; }
    }

    public class ItineraryItemDto
    {
        public int Day { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> Activities { get; set; } = new();
    }

    public class HotelRecommendationDto
    {
        public string Name { get; set; } = string.Empty;
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public decimal PricePerNight { get; set; }
        public string Currency { get; set; } = "USD";
        public string ImageUrl { get; set; } = string.Empty;
        public string BookingLink { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public GeoCoordinatesDto Coordinates { get; set; } = new();
    }

    public class GeoCoordinatesDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}