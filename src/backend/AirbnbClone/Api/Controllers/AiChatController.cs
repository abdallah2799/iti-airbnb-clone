using Microsoft.AspNetCore.Mvc;
using AirbnbClone.Infrastructure.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace AirbnbClone.Api.Controllers
{
    public class ChatRequest
    {
        public string Question { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AiChatController : ControllerBase
    {
        private readonly IAiAssistantService _aiService;
        private readonly ILogger<AiChatController> _logger;

        public AiChatController(IAiAssistantService aiService, ILogger<AiChatController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        [HttpPost("ask")]
        // [Authorize] // Optional: Uncomment to protect this endpoint
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest("Question cannot be empty.");

            try
            {
                // Delegate logic to the Infrastructure Layer
                var answer = await _aiService.AnswerUserQuestionAsync(request.Question);

                return Ok(new 
                { 
                    Question = request.Question, 
                    Answer = answer 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI chat request.");
                return StatusCode(500, "An error occurred while talking to the AI.");
            }
        }
    }
}