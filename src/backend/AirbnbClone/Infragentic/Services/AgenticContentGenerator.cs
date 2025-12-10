using Infragentic.Interfaces;
using Microsoft.SemanticKernel;

namespace Infragentic.Services
{
    public class AgenticContentGenerator : IAgenticContentGenerator
    {
        private readonly Kernel _kernel;
        private readonly IAgenticKnowledgeBase _knowledgeBase; // <--- Add this

        // Inject the KnowledgeBase here
        public AgenticContentGenerator(Kernel kernel, IAgenticKnowledgeBase knowledgeBase)
        {
            _kernel = kernel;
            _knowledgeBase = knowledgeBase;
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

        public async Task<string> AnswerQuestionWithRagAsync(string question)
        {
            // 1. Search Memory (Qdrant)
            // This part stays the same - facts are facts, regardless of who asks.
            var relevantContext = await _knowledgeBase.SearchKnowledgeAsync(question);

            // 2. Invoke the General Assistant
            var result = await _kernel.InvokeAsync(
                nameof(Plugins.GeneralAssistantPlugin), 
                "answer_general_question",
                new KernelArguments
                {
                    ["question"] = question,
                    ["context"] = string.IsNullOrWhiteSpace(relevantContext) ? "No info found." : relevantContext
                }
            );

            return result.GetValue<string>() ?? "I'm sorry, I couldn't generate an answer.";
        }
    }
}