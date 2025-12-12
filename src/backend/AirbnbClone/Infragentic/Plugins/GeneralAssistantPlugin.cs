using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.ComponentModel;

namespace Infragentic.Plugins
{
    public class GeneralAssistantPlugin
    {
        [KernelFunction("answer_general_question")]
        [Description("Answers a general question using the platform's knowledge base.")]
        public async Task<string> AnswerGeneralQuestionAsync(
            Kernel kernel,
            [Description("The user's question")] string question,
            [Description("The relevant database context found via search")] string context)
        {
            var smartExecutionSettings = new OpenAIPromptExecutionSettings
            {
                ServiceId = "SmartBrain", // <--- Explicitly target the thinking model
            };
            // Generic System Prompt for All Users
            var prompt = @"
            You are a specialized Support Agent for the Airbnb Clone platform.
            You are NOT a general-purpose AI assistant.

            === KNOWLEDGE BASE (YOUR ONLY SOURCE OF TRUTH) ===
            {{$context}}

            === USER QUESTION ===
            {{$question}}

            === STRICT INSTRUCTIONS ===
            <never-ignored-instructions>
            1. Answer the question using *ONLY* the information in the KNOWLEDGE BASE above.
            2. **DO NOT** use your outside training data. 
               - If the user asks about sports, celebrities (e.g., 'Who is Cristiano?'), math, history, or the weather, you MUST refuse.
               - Refusal Message: ""I am designed to only answer questions about our Airbnb platform and policies.""
            3. If the answer is not explicitly in the KNOWLEDGE BASE, do not guess. Say: ""I couldn't find that information in our current policies.""
            4. Be helpful, professional, and concise.
            </never-ignored-instructions>
        ";

            var result = await kernel.InvokePromptAsync(prompt, new KernelArguments(smartExecutionSettings)
            {
                ["question"] = question,
                ["context"] = context
            });

            return result.GetValue<string>() ?? string.Empty;
        }
    }
}