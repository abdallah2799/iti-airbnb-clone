using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Memory;
using System.Text;

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
#pragma warning disable SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly ISemanticTextMemory _memory; // The Database (Qdrant)
#pragma warning restore SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly Kernel _kernel;              // The Brain (OpenRouter)

#pragma warning disable SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        public AiChatController(ISemanticTextMemory memory, Kernel kernel)
#pragma warning restore SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        {
            _memory = memory;
            _kernel = kernel;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest("Question cannot be empty.");

            // 1. SEARCH: Find the most relevant info in Qdrant
            // "airbnb-help" must match the collection name used in your Ingestion Service
            var searchResults = _memory.SearchAsync("airbnb-help", request.Question, limit: 1, minRelevanceScore: 0.3);
            

            var contextBuilder = new StringBuilder();
            await foreach (var result in searchResults)
            {
                contextBuilder.AppendLine(result.Metadata.Text);
            }

            var foundContext = contextBuilder.ToString();

            // 2. PROMPT: Construct the prompt with the found context
            // If no context is found, we tell the AI to be honest.
            var prompt = $@"
                You are a helpful support assistant for an Airbnb host.
                
                CONTEXT INFORMATION (Truth):
                {foundContext}
                
                USER QUESTION: 
                {request.Question}

                INSTRUCTIONS:
                - Answer the question using ONLY the Context Information above.
                - If the Context is empty or doesn't contain the answer, say 'I'm sorry, I don't have that information in my manual.'
                - Be polite and concise.
            ";

            // 3. GENERATE: Send to OpenRouter/OpenAI
            var answer = await _kernel.InvokePromptAsync(prompt);

            // 4. Return result
            return Ok(new 
            { 
                Question = request.Question, 
                Answer = answer.GetValue<string>(),
                SourceUsed = !string.IsNullOrEmpty(foundContext) // Debug info to see if it found data
            });
        }
    }
}