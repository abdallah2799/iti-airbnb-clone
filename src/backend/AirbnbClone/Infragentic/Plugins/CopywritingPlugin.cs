using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.ComponentModel;

namespace Infragentic.Plugins
{
    public class CopywritingPlugin
    {
        [KernelFunction("generate_descriptions")]
        [Description("Generates catchy marketing descriptions for an Airbnb property.")]
        public async Task<string> GenerateDescriptionsAsync(
            Kernel kernel,
            [Description("The full details of the property")] string propertyDetails)
        {
            var fastExecutionSettings = new OpenAIPromptExecutionSettings
            {
                ServiceId = "FastBrain", // <--- Explicitly target the 20B model
            };

            // Creative System Prompt for Marketing
            var prompt = @"
                You are an expert Airbnb copywriter. 
                Write 5 catchy, distinct descriptions for the following property: 
                {{$propertyDetails}}
                
                Rules:
                - Make them exciting and inviting.
                - Keep each description under 50 words.
                - SEPARATE each description strictly with the delimiter '|||'.
                - Do NOT number them. Just the text.";

            var result = await kernel.InvokePromptAsync(prompt, new KernelArguments(fastExecutionSettings)
            {
                ["propertyDetails"] = propertyDetails
            });

            return result.GetValue<string>() ?? string.Empty;
        }
    }
}