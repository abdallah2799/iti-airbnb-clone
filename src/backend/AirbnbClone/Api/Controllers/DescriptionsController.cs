using Microsoft.AspNetCore.Mvc;
using AirbnbClone.Application.DTOs.AiAssistant;
using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DescriptionsController : ControllerBase
    {
        private readonly IAiAssistantService _aiService;

        public DescriptionsController(IAiAssistantService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateDescriptionDto request)
        {
            if (request == null)
                return BadRequest("Invalid request data.");

            // 1. Format the input into a single prompt string
            var amenitiesString = string.Join(", ", request.Amenities ?? new List<string>());
            
            var promptContext = $@"
                Property Title: {request.Title}
                Type: {request.PropertyType}
                Location: {request.Location}
                Amenities: {amenitiesString}
            ";

            // 2. Call the AI Service
            // The service handles talking to OpenRouter/OpenAI
            var descriptions = await _aiService.GenerateDescriptionsAsync(promptContext);

            // 3. Return the result
            return Ok(new 
            { 
                Count = descriptions.Count, 
                GeneratedDescriptions = descriptions 
            });
        }
    }
}
