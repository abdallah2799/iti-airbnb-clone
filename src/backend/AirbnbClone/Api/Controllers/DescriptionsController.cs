using Microsoft.AspNetCore.Mvc;
using AirbnbClone.Application.DTOs.AiAssistant;
using Infragentic.Interfaces; // <--- Using the New Layer

namespace AirbnbClone.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DescriptionsController : ControllerBase
    {
        // Use the new Interface from Infragentic
        private readonly IAgenticContentGenerator _agenticService;

        public DescriptionsController(IAgenticContentGenerator agenticService)
        {
            _agenticService = agenticService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateDescriptionDto request)
        {
            if (request == null)
                return BadRequest("Invalid request data.");

            // 1. Format the input
            var amenitiesString = string.Join(", ", request.Amenities ?? new List<string>());

            var promptContext = $@"
                Property Title: {request.Title}
                Type: {request.PropertyType}
                Location: {request.Location}
                Amenities: {amenitiesString}
            ";

            // 2. Call the Agentic Service
            // The service invokes the Kernel -> CopywritingPlugin -> OpenRouter
            var descriptions = await _agenticService.GenerateListingDescriptionsAsync(promptContext);

            // 3. Return the result
            return Ok(new
            {
                Count = descriptions.Count,
                GeneratedDescriptions = descriptions
            });
        }
    }
}