using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Qdrant.Client;
using Microsoft.SemanticKernel.Connectors.Qdrant;
using Infragentic.Interfaces;
using Infragentic.Services;
using Infragentic.Plugins;

namespace Infragentic
{
    public static class SemanticKernelExtensions
    {
        public static IServiceCollection AddAgenticInfrastructure(
            this IServiceCollection services,
            string openRouterKey,
            string chatModelId,
            string plannerModelId,
            string chatEndpoint,
            string qdrantHost,
            int qdrantPort,
            string embeddingModelId)
        {
            //---------------------------------------------------------
            // 0. REGISTER AGENT INVOCATION FILTER
            // ---------------------------------------------------------
            services.AddSingleton<IFunctionInvocationFilter, AgentInvocationFilter>();
            // 1. REGISTER INFRASTRUCTURE CLIENTS (Singleton)
            // ---------------------------------------------------------
            var qdrantClient = new QdrantClient(qdrantHost, qdrantPort);
            services.AddSingleton(qdrantClient);

            // ---------------------------------------------------------
            // 2. REGISTER APPLICATION SERVICES ( The Abstractions )
            // ---------------------------------------------------------
            services.AddScoped<IAgenticKnowledgeBase, QdrantKnowledgeBase>();
            services.AddScoped<IAgenticContentGenerator, AgenticContentGenerator>();

            // ---------------------------------------------------------
            // 3. REGISTER THE BRAIN (Kernel + AI Services)
            // ---------------------------------------------------------
            var builder = services.AddKernel();

            // 1. Register Plugins
            builder.Plugins.AddFromType<CopywritingPlugin>();
            builder.Plugins.AddFromType<GeneralAssistantPlugin>();
            builder.Plugins.AddFromType<DatabaseQueryPlugin>();
            builder.Plugins.AddFromType<GuestCommunicationPlugin>();
            builder.Plugins.AddFromType<TripDiscoveryPlugin>();
            builder.Plugins.AddFromType<BookingManagerPlugin>();

            // 2. Setup HTTP Client for OpenRouter
            // We use this single client for both Chat and Embeddings
            var openRouterClient = new HttpClient
            {
                BaseAddress = new Uri(chatEndpoint),
                Timeout = TimeSpan.FromSeconds(60)
            };

            // Add headers if needed for OpenRouter rankings
            openRouterClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost");

            // A. Smart Brain (Chat)
            builder.AddOpenAIChatCompletion(
                modelId: chatModelId,
                apiKey: openRouterKey,
                httpClient: openRouterClient, // Uses BaseAddress from client
                serviceId: "SmartBrain"
            );

            // B. Fast Brain (Planner)
            builder.AddOpenAIChatCompletion(
                modelId: plannerModelId,
                apiKey: openRouterKey,
                httpClient: openRouterClient, // Uses BaseAddress from client
                serviceId: "FastBrain"
            );

            // B. Embedding Generation (The "Translator" for RAG)
            // FIXED: Now points to OpenRouter instead of OpenAI.com
            builder.AddOpenAITextEmbeddingGeneration(
                modelId: embeddingModelId,
                apiKey: openRouterKey,
                httpClient: openRouterClient      // <--- ADDED THIS
            );

            // C. Connect Semantic Kernel to Qdrant (The "Memory")
            builder.Services.AddQdrantVectorStore();

            return services;
        }
    }
}