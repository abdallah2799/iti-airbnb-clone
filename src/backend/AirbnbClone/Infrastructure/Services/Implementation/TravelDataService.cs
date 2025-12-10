using System.Text.Json;
using Core.DTOs.TripPlanner;
using Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.Implementation
{
    public class TravelDataService : ITravelDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TravelDataService> _logger;
        // Move to appsettings.json!
        private const string SerpApiKey = "f0b73234b6101a365285f9466f3ae4765e39133e06d1c5388d54a9e126d14215";

        public TravelDataService(HttpClient httpClient, ILogger<TravelDataService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<HotelRecommendationDto>> GetHotelRecommendationsAsync(TripSearchCriteriaDto criteria)
        {
            try
            {
                var checkIn = criteria.StartDate.ToString("yyyy-MM-dd");
                var checkOut = criteria.EndDate.ToString("yyyy-MM-dd");

                var url = $"https://serpapi.com/search.json?engine=google_hotels&q={criteria.Destination}&check_in_date={checkIn}&check_out_date={checkOut}&currency={criteria.Currency}&adults={criteria.Travelers.Adults}&sort_by=8&api_key={SerpApiKey}";

                var responseString = await _httpClient.GetStringAsync(url);
                using var doc = JsonDocument.Parse(responseString);

                var hotels = new List<HotelRecommendationDto>();

                if (doc.RootElement.TryGetProperty("properties", out var props))
                {
                    foreach (var hotel in props.EnumerateArray())
                    {
                        // Filter logic from your JS Node
                        if (!hotel.TryGetProperty("rate_per_night", out var rateObj) ||
                            !rateObj.TryGetProperty("extracted_lowest", out var priceEl)) continue;

                        if (!hotel.TryGetProperty("overall_rating", out var ratingEl)) continue;

                        var rec = new HotelRecommendationDto
                        {
                            Name = hotel.GetProperty("name").GetString() ?? "Unknown Hotel",
                            Rating = ratingEl.GetDouble(),
                            ReviewCount = hotel.TryGetProperty("reviews", out var rev) ? rev.GetInt32() : 0,
                            PricePerNight = priceEl.GetDecimal(),
                            Currency = criteria.Currency,
                            BookingLink = hotel.TryGetProperty("link", out var link) ? link.GetString() : "",
                            Description = hotel.TryGetProperty("description", out var desc) ? desc.GetString() : "No description available.",
                        };

                        // Image Safety Check
                        if (hotel.TryGetProperty("images", out var imgs) && imgs.GetArrayLength() > 0)
                        {
                            rec.ImageUrl = imgs[0].GetProperty("original_image").GetString() ?? "";
                        }
                        else
                        {
                            rec.ImageUrl = "https://via.placeholder.com/300";
                        }

                        // Coordinates
                        if (hotel.TryGetProperty("gps_coordinates", out var gps))
                        {
                            rec.Coordinates = new GeoCoordinatesDto
                            {
                                Latitude = gps.GetProperty("latitude").GetDouble(),
                                Longitude = gps.GetProperty("longitude").GetDouble()
                            };
                        }

                        hotels.Add(rec);
                    }
                }

                // Return Top 3
                return hotels.Take(3).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch hotels from SerpApi");
                return new List<HotelRecommendationDto>(); // Return empty list on failure, don't crash
            }
        }
    }
}