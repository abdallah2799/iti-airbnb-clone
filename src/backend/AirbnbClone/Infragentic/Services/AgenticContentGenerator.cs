using Core.Interfaces;
using Infragentic.Interfaces;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Infragentic.Services
{
    public class AgenticContentGenerator : IAgenticContentGenerator
    {
        private readonly Kernel _kernel;
        private readonly IAgenticKnowledgeBase _knowledgeBase;
        private readonly IDatabaseSchemaService _schemaService;

        // Inject the KnowledgeBase here
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

        public async Task<string> AnswerQuestionWithRagAsync(string question, string? userId = null)
        {
            // 1. Get Tools & Context
            string userContext = string.IsNullOrEmpty(userId) ? "Guest (Unauthenticated)" : $"Authenticated User (ID: {userId})";
            var ragContext = await _knowledgeBase.SearchKnowledgeAsync(question);

            // 2. Get Database Map
            var dbSchema = _schemaService.GetSchemaForAi();

            // 3. Construct the "God Mode" System Prompt
            var systemPrompt = $@"
                You are an intelligent Assistant for the Airbnb Clone platform.
                
                YOUR TOOLS:
                1. Knowledge Base: Use this for policy/rule questions.
                2. SQL Database: Use 'execute_sql_query' for data/analytics questions.

                DATABASE SCHEMA:
                {dbSchema}

                CURRENT USER: {userContext}

                RULES:
                - If the user asks for data (counts, sums, lists), WRITE A SQL QUERY.
                - ALWAYS filter by 'HostId = [CURRENT USER ID]' for private data.
                - Do NOT query private tables for Guests.
                - Return the SQL query inside the tool call.

                CONTEXT:
                {ragContext}
            ";

            // 4. Enable Auto-Tool Calling
            OpenAIPromptExecutionSettings settings = new()
            {
                ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
            };

            var arguments = new KernelArguments(settings)
            {
                ["currentUserId"] = userId ?? ""
            };

            // 5. Run
            var result = await _kernel.InvokePromptAsync(
                $"{systemPrompt}\n\nUSER QUESTION: {question}",
                arguments
            );

            return result.GetValue<string>() ?? "I'm sorry, I couldn't answer that.";
        }
    }
}