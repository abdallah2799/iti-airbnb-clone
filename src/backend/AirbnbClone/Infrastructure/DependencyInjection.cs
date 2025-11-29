using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using AirbnbClone.Infrastructure.Services.Implementation;
using AirbnbClone.Infrastructure.Services.Interfaces;
using System;
using System.Net.Http;

namespace AirbnbClone.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // --- AI CONFIGURATION ---
            var aiConfig = configuration.GetSection("AI");
            
            // CHECK BOTH KEY NAMES (Fallback strategy)
            var apiKey = aiConfig["OpenAIKey"] ?? aiConfig["ApiKey"]; 
            var chatModel = aiConfig["OpenAIModel"] ?? aiConfig["ChatModel"] ?? "gpt-4o-mini";
            var embeddingModel = aiConfig["EmbeddingModel"] ?? "text-embedding-3-small";
            var endpoint = aiConfig["OpenAIEndpoint"]; 

            // 1. Register Kernel (Unconditional)
            var kernelBuilder = services.AddKernel();

            if (!string.IsNullOrEmpty(apiKey))
            {
                // 2. Configure Chat (The Voice)
                if (!string.IsNullOrEmpty(endpoint))
                {
                    // Custom Endpoint (OpenRouter)
                    var customClient = new HttpClient 
                    { 
                        BaseAddress = new Uri(endpoint), 
                        Timeout = TimeSpan.FromMinutes(5) 
                    };

                    kernelBuilder.AddOpenAIChatCompletion(
                        modelId: chatModel,
                        apiKey: apiKey,
                        httpClient: customClient 
                    );

                    // 3. Configure Embeddings (The Memory) - CRITICAL
#pragma warning disable SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
                    kernelBuilder.AddOpenAITextEmbeddingGeneration(
                        modelId: embeddingModel,
                        apiKey: apiKey,
                        httpClient: customClient
                    );
#pragma warning restore SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
                }
                else
                {
                    // Standard OpenAI
                    kernelBuilder.AddOpenAIChatCompletion(chatModel, apiKey);

                    // CRITICAL: This registers ITextEmbeddingGenerationService
#pragma warning disable SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
                    kernelBuilder.AddOpenAITextEmbeddingGeneration(embeddingModel, apiKey);
#pragma warning restore SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
                }
            }
            else
            {
                // Log warning if we can't find the key, so you know why it's failing
                Console.WriteLine("⚠️ WARNING: AI:OpenAIKey is missing in appsettings.json. AI features will crash.");
            }

            // 3. Register Application Services
            services.AddScoped<IAiAssistantService, AiAssistantService>();
            
            return services;
        }
    }
}