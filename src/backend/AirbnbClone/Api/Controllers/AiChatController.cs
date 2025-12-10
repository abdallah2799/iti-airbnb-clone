using Microsoft.AspNetCore.Mvc;
using Infragentic.Interfaces; // <--- Use the new Layer
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
        // Change from IAiAssistantService to IAgenticContentGenerator
        private readonly IAgenticContentGenerator _agenticService;
        private readonly ILogger<AiChatController> _logger;

        public AiChatController(IAgenticContentGenerator agenticService, ILogger<AiChatController> logger)
        {
            _agenticService = agenticService;
            _logger = logger;
        }

        [HttpPost("ask")]
        // [Authorize] 
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest("Question cannot be empty.");

            try
            {
                // The Agentic Layer handles: Vector Search -> Context Building -> LLM Generation
                var answer = await _agenticService.AnswerQuestionWithRagAsync(request.Question);

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