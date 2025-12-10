using System.Security.Claims; // <--- REQUIRED for ClaimTypes
using Microsoft.AspNetCore.Mvc;
using Infragentic.Interfaces;

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
        private readonly IAgenticContentGenerator _agenticService;
        private readonly ILogger<AiChatController> _logger;

        public AiChatController(IAgenticContentGenerator agenticService, ILogger<AiChatController> logger)
        {
            _agenticService = agenticService;
            _logger = logger;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest("Question cannot be empty.");

            try
            {
                // 1. EXTRACT USER ID CORRECTLY
                // ClaimTypes.NameIdentifier is the standard claim for the User's Primary Key (Id)
                // If the user is not logged in, this returns null, which is exactly what we want for Guests.
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // 2. PASS TO AGENT
                var answer = await _agenticService.AnswerQuestionWithRagAsync(request.Question, userId);

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