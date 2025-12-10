using Core.DTOs.TripPlanner;
using Core.Interfaces;
using Infragentic.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AirbnbClone.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TripPlannerController : ControllerBase
    {
        private readonly ITravelDiscoveryService _discoveryService;
        private readonly ILogger<TripPlannerController> _logger;

        public TripPlannerController(
            ITravelDiscoveryService discoveryService,
            ILogger<TripPlannerController> logger)
        {
            _discoveryService = discoveryService;
            _logger = logger;
        }

        [HttpPost("discover")]
        public async Task<IActionResult> DiscoverTrip([FromBody] TripSearchCriteriaDto request)
        {
            if (request == null) return BadRequest("Invalid request.");

            // Basic Validation
            if (string.IsNullOrWhiteSpace(request.Destination))
                return BadRequest("Destination is required.");

            if (request.EndDate < request.StartDate)
                return BadRequest("End date must be after start date.");

            try
            {
                _logger.LogInformation("Starting Trip Discovery for {Destination}", request.Destination);

                // This triggers the Parallel AI + SerpApi Workflow
                var result = await _discoveryService.DiscoverTripAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during trip discovery.");
                return StatusCode(500, "An error occurred while generating your trip.");
            }
        }
    }
}