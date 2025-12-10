using System.ComponentModel;
using Microsoft.SemanticKernel;

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
            // Generic System Prompt for All Users
            var prompt = @"
                You are a helpful, friendly assistant for the Airbnb Clone platform.
                You are speaking to a user (who could be a Guest, a Host, or a Visitor).
                
                KNOWLEDGE BASE (The Truth):
                {{$context}}
                
                USER QUESTION: 
                {{$question}}

                INSTRUCTIONS:
                - Answer using ONLY the Knowledge Base information above.
                - If the answer is not in the context, politely say you don't know.
                - Be concise and helpful.";

            var result = await kernel.InvokePromptAsync(prompt, new KernelArguments
            {
                ["question"] = question,
                ["context"] = context
            });

            return result.GetValue<string>() ?? string.Empty;
        }
    }
}