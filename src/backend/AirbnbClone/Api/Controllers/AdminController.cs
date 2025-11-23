using Microsoft.AspNetCore.Mvc;
using AirbnbClone.Application.DTOs.AiAssistant;
using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        // private readonly IAiAssistantService _aiService;

        // public AdminController(IAiAssistantService aiService)
        // {
        //     _aiService = aiService;
        // }

        [HttpPost("ingest-knowledge")]
        public async Task<IActionResult> Ingest([FromServices] IKnowledgeBaseService knowledgeService)
        {
            await knowledgeService.IngestKnowledgeAsync();
            return Ok("Knowledge Base Updated Successfully!");
        }
    }
}