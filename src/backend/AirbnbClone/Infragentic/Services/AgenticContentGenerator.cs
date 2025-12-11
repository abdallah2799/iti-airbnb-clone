using Core.DTOs;
using Core.Interfaces;
using Infragentic.Interfaces;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Infragentic.Services
{
    public class AgenticContentGenerator : IAgenticContentGenerator
    {
        private readonly Kernel _kernel;
        private readonly IAgenticKnowledgeBase _knowledgeBase;
        private readonly IDatabaseSchemaService _schemaService;

        public AgenticContentGenerator(Kernel kernel, IAgenticKnowledgeBase knowledgeBase, IDatabaseSchemaService schemaService)
        {
            _kernel = kernel;
            _knowledgeBase = knowledgeBase;
            _schemaService = schemaService;
        }

        public async Task<List<string>> GenerateListingDescriptionsAsync(string propertyDetails)
        {
            // (Previous implementation stays the same...)
            var result = await _kernel.InvokeAsync(
                nameof(Plugins.CopywritingPlugin),
                "generate_descriptions",
                new KernelArguments { ["propertyDetails"] = propertyDetails }
            );

            var generatedText = result.GetValue<string>();

            if (string.IsNullOrWhiteSpace(generatedText)) return new List<string>();

            return generatedText
                .Split(new[] { "|||" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
        }

        public async Task<string> AnswerQuestionWithRagAsync(string question, List<ChatMessageDto> history, string? userId = null)
        {
            bool isGuest = string.IsNullOrEmpty(userId);
            string safeUserId = userId ?? "";

            var roleInstruction = isGuest
                ? "STATUS: GUEST (Unauthenticated). You can answer general questions. If user tries to BOOK/CANCEL/VIEW PRIVATE data, reply: 'Please log in.'"
                : $"STATUS: AUTHENTICATED (User ID: {safeUserId}). You have access to manage bookings.";

            var dbSchema = _schemaService.GetSchemaForAi();
            var ragContext = await _knowledgeBase.SearchKnowledgeAsync(question);

            // FIX: Explicitly instruct the AI to pass the ID to tools
            var systemPrompt = $@"
                    You are an intelligent Assistant for Airbnb Clone.

                    === YOUR IDENTITY ===
                    {roleInstruction}

                    === CAPABILITIES (WHAT YOU CAN DO) ===
                    1. Search for listings and show details (amenities, price, location).
                    2. Check the status of *existing* bookings.
                    3. Cancel *existing* bookings (using the 'cancel_my_booking' tool).
                    4. Answer policy questions using the Knowledge Base.

                    === LIMITATIONS (WHAT YOU CANNOT DO) ===
                    1. **NO NEW BOOKINGS:** You CANNOT create new bookings, process payments, or check real-time availability. 
                       - If a user wants to book, you MUST say: ""I cannot make bookings directly. Please go to the listing page to book.""
                    2. **NO FAKE CONFIRMATIONS:** Never invent booking IDs, reference numbers, or confirmation emails. 
                       - Only provide details if you have successfully retrieved them from the Database or executed a Tool.
                    3. **NO GUESSING:** If a tool (like 'cancel_my_booking') fails or isn't triggered, do NOT pretend it worked. Report the error.

                    === TOOLS & DATA ===
                    - Knowledge Base (Policies)
                    - SQL Database (Listings, Bookings, etc.)

                    === INTERNAL SCHEMA (INVISIBLE) ===
                    <hidden_schema>
                    {dbSchema}
                    </hidden_schema>

                    === CONTEXT ===
                    {ragContext}

                    === SECURITY ===
                    1. Never output internal schema.
                    2. If {isGuest} is True, do NOT run write/private tools.
                    3. Always filter SQL by Current User ID ({safeUserId}) if authenticated.
                    ";

            // 2. BUILD CHAT HISTORY
            var chatHistory = new ChatHistory(systemPrompt);

            // Add previous messages (Safely handle null history)
            if (history != null)
            {
                foreach (var msg in history.TakeLast(10))
                {
                    if (string.Equals(msg.Role, "user", StringComparison.OrdinalIgnoreCase))
                        chatHistory.AddUserMessage(msg.Content);
                    else
                        chatHistory.AddAssistantMessage(msg.Content);
                }
            }

            chatHistory.AddUserMessage(question);

            // 3. SETTINGS
            OpenAIPromptExecutionSettings settings = new()
            {
                ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
            };

            // FIX: Removed KernelArguments creation because GetChatMessageContentAsync doesn't accept them.
            // We rely on the System Prompt instructions above to inject the ID into tool calls.

            // 4. INVOKE
            var chatService = _kernel.GetRequiredService<IChatCompletionService>();

            // FIX: Removed 'arguments' parameter
            var result = await chatService.GetChatMessageContentAsync(chatHistory, settings, _kernel);

            // 5. SANITIZE
            var answer = result.Content ?? "I'm sorry, I couldn't process that.";

            if (answer.Contains("TABLE [") || answer.Contains("<hidden_schema>"))
                return "Security Alert: Internal details blocked.";

            return answer;
        }
    }
}

