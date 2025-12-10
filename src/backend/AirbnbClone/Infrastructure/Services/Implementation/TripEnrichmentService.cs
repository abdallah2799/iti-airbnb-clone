using System.Net.Http.Json;
using Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.Implementation
{
    public class TripEnrichmentService : ITripEnrichmentService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TripEnrichmentService> _logger;
        // Ticketmaster Key (Move to appsettings in production)
        private const string TicketMasterKey = "nvGzkjQIjBGN59uA55k7CfmYAqkhxEXL";

        public TripEnrichmentService(HttpClient httpClient, ILogger<TripEnrichmentService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<string> GetWeatherForecastAsync(double lat, double lon, DateTime start, DateTime end)
        {
            try
            {
                var sDate = start.ToString("yyyy-MM-dd");
                var eDate = end.ToString("yyyy-MM-dd");
                var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,precipitation_sum&start_date={sDate}&end_date={eDate}&timezone=auto";

                var response = await _httpClient.GetStringAsync(url);
                return response; // Return raw JSON for the AI to parse (it's good at it)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch weather.");
                return "Weather data unavailable.";
            }
        }

        public async Task<string> GetLocalEventsAsync(string city, DateTime start, DateTime end)
        {
            try
            {
                var sDate = start.ToString("yyyy-MM-ddTHH:mm:ssZ");
                var eDate = end.ToString("yyyy-MM-ddTHH:mm:ssZ");
                var url = $"https://app.ticketmaster.com/discovery/v2/events.json?apikey={TicketMasterKey}&city={city}&startDateTime={sDate}&endDateTime={eDate}&sort=date,asc&size=5";

                var response = await _httpClient.GetStringAsync(url);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch events.");
                return "No events data available.";
            }
        }
    }
}