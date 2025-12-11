using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Infragentic.Interfaces;
using Core.DTOs; // Ensure you have this for ChatMessageDto

namespace AirbnbClone.Api.Controllers
{
    // Update the Request Model to accept History
    public class ChatRequest
    {
        public string Question { get; set; } = string.Empty;
        public List<ChatMessageDto> History { get; set; } = new(); // <--- ADD THIS
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AiChatController : ControllerBase
    {
        private readonly IAgenticContentGenerator _agenticService;
        private readonly ILogger<AiChatController> _logger;
        private const int MaxQuestionLength = 1200;

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

            if (request.Question.Length > MaxQuestionLength)
            {
                _logger.LogWarning("Blocked long request.");
                return BadRequest("Question too long.");
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // FIX: Pass the History as the 2nd argument
                var answer = await _agenticService.AnswerQuestionWithRagAsync(
                    request.Question,
                    request.History, // <--- THE MISSING ARGUMENT
                    userId
                );

                return Ok(new
                {
                    Question = request.Question,
                    Answer = answer
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI chat request.");
                return StatusCode(500, "An error occurred.");
            }
        }
    }
}