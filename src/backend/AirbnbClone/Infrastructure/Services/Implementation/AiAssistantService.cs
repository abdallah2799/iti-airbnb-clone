using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI; // Required for Prompt Execution Settings
using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Infrastructure.Services.Implementation
{
    public class AiAssistantService : IAiAssistantService
    {
        private readonly Kernel _kernel;

        // We inject the "Kernel" which is our gateway to the AI
        public AiAssistantService(Kernel kernel)
        {
            _kernel = kernel;
        }

        public async Task<List<string>> GenerateDescriptionsAsync(string propertyDetails)
        {
            // 1. Define the Prompt
            // We ask for a specific delimiter "|||" so we can split the result easily later.
            var prompt = @"
                You are an expert Airbnb copywriter. 
                Write 5 catchy, distinct descriptions for the following property: 
                {{$input}}
                
                Rules:
                - Make them exciting and inviting.
                - Keep each description under 50 words.
                - SEPARATE each description strictly with the delimiter '|||'.
                - Do NOT number them. Just the text.";

            // 2. Create the Function
            var createDescriptionFunc = _kernel.CreateFunctionFromPrompt(prompt, new OpenAIPromptExecutionSettings
            {
                MaxTokens = 500,
                Temperature = 0.8 // High creativity
            });

            // 3. Execute
            var result = await createDescriptionFunc.InvokeAsync(_kernel, new KernelArguments { ["input"] = propertyDetails });

            // 4. Process Logic (The "Cleaning" part)
            // We take the big string and split it into a List<string>
            var generatedText = result.GetValue<string>();
            
            if (string.IsNullOrWhiteSpace(generatedText)) 
                return new List<string>();

            return generatedText
                .Split(new[] { "|||" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
        }
    }
}