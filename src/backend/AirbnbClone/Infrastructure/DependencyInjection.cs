using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI; // <--- This fixes your error
using Microsoft.SemanticKernel.Connectors.Qdrant;
using Microsoft.SemanticKernel.Memory;
using AirbnbClone.Infrastructure.Services.Implementation;
using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var aiConfig = configuration.GetSection("AI");
            var apiKey = aiConfig["OpenAIKey"];
            var chatModel = aiConfig["OpenAIModel"];
            var embeddingModel = aiConfig["EmbeddingModel"];
            var endpoint = aiConfig["OpenAIEndpoint"];
            var qdrantEndpoint = aiConfig["QdrantEndpoint"];

            // 1. Register Chat (The Brain)
            // We use the #pragma to suppress "Experimental" warnings
            #pragma warning disable SKEXP0001, SKEXP0010, SKEXP0020
            services.AddKernel()
                .AddOpenAIChatCompletion(
                    modelId: chatModel,
                    apiKey: apiKey,
                    endpoint: new Uri(endpoint)
                );

            // 2. Register Memory (The Database)
            // This works here because Infrastructure HAS the Qdrant package
            var memoryStore = new QdrantMemoryStore(qdrantEndpoint, vectorSize: 1536);

            var openRouterClient = new HttpClient
            {
                BaseAddress = new Uri(endpoint),
                Timeout = TimeSpan.FromMinutes(1)
            };

            var memoryBuilder = new MemoryBuilder()
                .WithOpenAITextEmbeddingGeneration(
                    modelId: embeddingModel,
                    apiKey: apiKey,
                    httpClient: openRouterClient // <--- This is the fix
                )
                .WithMemoryStore(memoryStore)
                .Build();

            services.AddSingleton<ISemanticTextMemory>(memoryBuilder);
            #pragma warning restore SKEXP0001, SKEXP0010, SKEXP0020

            // 3. Register Your Services
            // (Make sure these interfaces/classes exist in your project)
            // services.AddScoped<IGenerativeAiService, OpenRouterAiService>(); 
            services.AddScoped<IKnowledgeBaseService, QdrantRagService>();
            services.AddScoped<IAiAssistantService, AiAssistantService>();

            return services;
        }
    }
}