using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.Embeddings; // Required for Embedding generation
using AirbnbClone.Infrastructure.Services.Interfaces;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace AirbnbClone.Infrastructure.Services.Implementation
{
    public class AiAssistantService : IAiAssistantService
    {
        private readonly Kernel _kernel;
        private readonly ILogger<AiAssistantService> _logger;
        private readonly QdrantClient _qdrantClient;
        private const string CollectionName = "airbnb_knowledge";

        // We inject:
        // 1. Kernel (OpenAI logic)
        // 2. QdrantClient (Vector DB logic)
        // 3. Logger (Observability)
        public AiAssistantService(Kernel kernel, ILogger<AiAssistantService> logger, QdrantClient qdrantClient)
        {
            _kernel = kernel;
            _logger = logger;
            _qdrantClient = qdrantClient;
        }

        public async Task<List<string>> GenerateDescriptionsAsync(string propertyDetails)
        {
            // 1. Define the Prompt
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

            // 4. Process Logic
            var generatedText = result.GetValue<string>();

            if (string.IsNullOrWhiteSpace(generatedText))
                return new List<string>();

            return generatedText
                .Split(new[] { "|||" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
        }

        /// <summary>
        /// Updates the Vector Database (Qdrant) with new knowledge from SQL + JSON.
        /// This is a heavy operation, typically called by Background Services.
        /// </summary>
        public async Task UpdateKnowledgeBaseAsync(List<string> documents)
        {
            try
            {
                // 1. Ensure Collection Exists
                // Vector Size 1536 is standard for OpenAI text-embedding-ada-002 or similar models
                var collections = await _qdrantClient.ListCollectionsAsync();
                if (!collections.Any(c => c == CollectionName))
                {
                    await _qdrantClient.CreateCollectionAsync(CollectionName, new VectorParams { Size = 1536, Distance = Distance.Cosine });
                    _logger.LogInformation($"Created Qdrant collection: {CollectionName}");
                }

                var points = new List<PointStruct>();

                // Use GetRequiredService to retrieve the ITextEmbeddingGenerationService from the Kernel
#pragma warning disable SKEXP0001 
                var embeddingGenerator = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
#pragma warning restore SKEXP0001

                // 2. Loop through documents and convert Text -> Vector
                foreach (var doc in documents)
                {
                    try
                    {
                        // Generate Vector (Float Array)
                        var embedding = await embeddingGenerator.GenerateEmbeddingAsync(doc);

                        // Create Point (ID + Vector + Payload)
                        points.Add(new PointStruct
                        {
                            Id = Guid.NewGuid(),
                            Vectors = embedding.ToArray(),
                            Payload = { ["content"] = doc }
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to generate embedding for a document segment.");
                    }
                }

                // 3. Batch Upload to Qdrant
                if (points.Any())
                {
                    await _qdrantClient.UpsertAsync(CollectionName, points);
                    _logger.LogInformation($"Successfully upserted {points.Count} knowledge vectors to Qdrant.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical failure updating Qdrant knowledge base.");
                throw; // Re-throw so the background worker knows it failed
            }
        }

        /// <summary>
        /// The RAG Method: Searches Qdrant for context and asks the LLM to answer.
        /// Implemented to satisfy IAiAssistantService.
        /// </summary>
        public async Task<string> AnswerUserQuestionAsync(string question)
        {
            // 1. GENERATE EMBEDDING (Turn question into numbers)
#pragma warning disable SKEXP0001 
            var embeddingGenerator = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
#pragma warning restore SKEXP0001

            var questionEmbedding = await embeddingGenerator.GenerateEmbeddingAsync(question);

            // 2. SEARCH QDRANT (Find relevant Listings/Rules)
            var searchResults = await _qdrantClient.SearchAsync(
                CollectionName,
                questionEmbedding.ToArray(),
                limit: 10,
                scoreThreshold: 0.3f // Only return good matches
            );

            // 3. BUILD CONTEXT
            var contextBuilder = new StringBuilder();
            if (searchResults.Any())
            {
                contextBuilder.AppendLine("Here is some relevant information from our database:");
                foreach (var point in searchResults)
                {
                    if (point.Payload.TryGetValue("content", out var contentVal))
                    {
                        contextBuilder.AppendLine($"- {contentVal.StringValue}");
                    }
                }
            }
            else
            {
                contextBuilder.AppendLine("No specific listing details or rules were found in the database matching this question.");
            }

            // 4. PROMPT THE AI
            var prompt = $@"
                You are a helpful support assistant for an Airbnb host.
                
                CONTEXT INFORMATION (The Truth):
                {contextBuilder}
                
                USER QUESTION: 
                {question}

                INSTRUCTIONS:
                - Answer the question using ONLY the Context Information above.
                - If the Context doesn't have the answer, say 'I'm sorry, I don't have that information available.'
                - Be polite, professional, and concise.
            ";

            // 5. INVOKE LLM
            var result = await _kernel.InvokePromptAsync(prompt);
            return result.GetValue<string>() ?? "I'm sorry, I couldn't generate an answer.";
        }
    }
}