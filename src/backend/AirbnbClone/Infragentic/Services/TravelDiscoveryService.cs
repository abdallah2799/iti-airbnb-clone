using Core.DTOs.TripPlanner;
using Core.Interfaces; // For ITravelDataService
using Infragentic.Interfaces; // For interface definition
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.Text.Json;

namespace Infragentic.Services
{
    public class TravelDiscoveryService : ITravelDiscoveryService
    {
        private readonly Kernel _kernel;
        private readonly ITravelDataService _travelDataService;
        private readonly ILogger<TravelDiscoveryService> _logger;

        public TravelDiscoveryService(
            Kernel kernel,
            ITravelDataService travelDataService,
            ILogger<TravelDiscoveryService> logger)
        {
            _kernel = kernel;
            _travelDataService = travelDataService;
            _logger = logger;
        }

        public async Task<TripResponseDto> DiscoverTripAsync(TripSearchCriteriaDto criteria)
        {
            // 1. Calculate Duration (C# Logic - Node 2 replacement)
            var durationDays = (criteria.EndDate - criteria.StartDate).Days + 1;
            if (durationDays < 1) durationDays = 1;

            // ---------------------------------------------------------
            // 2. PARALLEL EXECUTION (The Speed Boost)
            // ---------------------------------------------------------

            // Task A: Fetch Hotels (SerpApi)
            var hotelsTask = _travelDataService.GetHotelRecommendationsAsync(criteria);

            // Task B: Generate AI Content

            var fastSettings = new OpenAIPromptExecutionSettings
            {
                ServiceId = "FastBrain"
            };

            var interestsStr = string.Join(", ", criteria.Interests);
            var aiTask = _kernel.InvokeAsync<string>(
                nameof(Plugins.TripDiscoveryPlugin),
                "generate_trip_content",
                new KernelArguments(fastSettings)
                {
                    ["destination"] = criteria.Destination,
                    ["days"] = durationDays,
                    ["interests"] = interestsStr,
                    ["budget"] = criteria.BudgetLevel
                }
            );

            // Wait for both to finish
            await Task.WhenAll(hotelsTask, aiTask);

            // ---------------------------------------------------------
            // 3. MERGE RESULTS (Node 6 replacement)
            // ---------------------------------------------------------
            var hotels = await hotelsTask;
            var aiJson = await aiTask;

            var response = new TripResponseDto();

            // Deserializing the AI JSON (Safe Parse)
            try
            {
                // We parse the AI's partial structure
                var aiData = JsonSerializer.Deserialize<TripResponseDto>(aiJson!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (aiData != null)
                {
                    response.TripOverview = aiData.TripOverview;
                    response.EstimatedCosts = aiData.EstimatedCosts;
                    response.Itinerary = aiData.Itinerary;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse AI JSON response.");
                // Fallback basic data so the UI doesn't crash
                response.TripOverview.Title = $"Trip to {criteria.Destination}";
                response.TripOverview.Description = "AI generation failed, but here are your hotels.";
            }

            // Inject the Real Hotels
            response.LodgingRecommendations = hotels;

            // Inject the Real Coordinates (from the first hotel, or default)
            if (hotels.Count > 0)
            {
                response.TripOverview.Coordinates = hotels[0].Coordinates;
            }

            return response;
        }
    }
}