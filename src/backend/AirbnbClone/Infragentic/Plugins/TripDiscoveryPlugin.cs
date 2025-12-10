using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace Infragentic.Plugins
{
    public class TripDiscoveryPlugin
    {
        [KernelFunction("generate_trip_content")]
        [Description("Generates the creative content (Overview, History, Itinerary) for a trip.")]
        public async Task<string> GenerateTripContentAsync(
            Kernel kernel,
            [Description("Destination city")] string destination,
            [Description("Trip duration in days")] int days,
            [Description("User interests")] string interests,
            [Description("Budget level")] string budget)
        {
            var prompt = @"
                You are a Travel API Backend.
                
                CONTEXT:
                Destination: {{$destination}}
                Duration: {{$days}} days
                Interests: {{$interests}}
                Budget: {{$budget}}

                INSTRUCTIONS:
                Generate a structured JSON response containing trip details.
                - History: Focus on founding/pre-colonial.
                - Itinerary: Create a daily plan.
                - Costs: Estimate costs based on the budget level.

                CRITICAL: RETURN ONLY RAW JSON. NO MARKDOWN. NO ```json wrappers.
                
                // ... inside the prompt string ...

                JSON SCHEMA:
                {
                    ""trip_overview"": {
                        ""title"": ""Catchy Trip Title"",
                        ""description"": ""Engaging description..."",
                        ""history"": ""Historical overview...""
                    },
                    ""estimated_costs"": {
                        ""accommodation"": 0,
                        ""transportation"": 0,
                        ""food"": 0
                    },
                    ""itinerary"": [
                        { ""day"": 1, ""title"": ""Day Title"", ""activities"": [""Activity 1"", ""Activity 2""] }
                    ]
                }
            ";

            var result = await kernel.InvokePromptAsync(prompt, new KernelArguments
            {
                ["destination"] = destination,
                ["days"] = days,
                ["interests"] = interests,
                ["budget"] = budget
            });

            // Clean markdown if the AI adds it despite instructions
            var text = result.GetValue<string>() ?? "{}";
            return text.Replace("```json", "").Replace("```", "").Trim();
        }
    }
}