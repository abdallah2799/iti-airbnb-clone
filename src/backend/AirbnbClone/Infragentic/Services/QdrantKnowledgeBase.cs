using Infragentic.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Embeddings;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Infragentic.Services
{
    public class QdrantKnowledgeBase : IAgenticKnowledgeBase
    {
        private readonly QdrantClient _qdrantClient;
        private readonly Kernel _kernel; 
        private readonly ILogger<QdrantKnowledgeBase> _logger;

        public QdrantKnowledgeBase(QdrantClient qdrantClient, Kernel kernel, ILogger<QdrantKnowledgeBase> logger)
        {
            _qdrantClient = qdrantClient;
            _kernel = kernel;
            _logger = logger;
        }

        public async Task UpsertKnowledgeAsync(List<string> documents, string collectionName)
        {
            if (!documents.Any()) return;

            // 1. Ensure Collection Exists
            var collections = await _qdrantClient.ListCollectionsAsync();
            if (!collections.Any(c => c == collectionName))
            {
                await _qdrantClient.CreateCollectionAsync(collectionName, new VectorParams { Size = 1536, Distance = Distance.Cosine });
            }

            // 2. Get the Embedding Service from the Kernel
            var embeddingGenerator = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
            var points = new List<PointStruct>();

            foreach (var doc in documents)
            {
                try
                {
                    // Generate Vector
                    var embedding = await embeddingGenerator.GenerateEmbeddingAsync(doc);

                    points.Add(new PointStruct
                    {
                        Id = Guid.NewGuid(),
                        Vectors = embedding.ToArray(),
                        Payload = { ["content"] = doc }
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to embed document segment.");
                }
            }

            // 3. Upsert
            if (points.Any())
            {
                await _qdrantClient.UpsertAsync(collectionName, points);
                _logger.LogInformation($"[Infragentic] Upserted {points.Count} vectors to {collectionName}");
            }
        }

        public async Task<string> SearchKnowledgeAsync(string query, string collectionName)
        {
            try
            {
                var embeddingGenerator = _kernel.GetRequiredService<ITextEmbeddingGenerationService>();
                var vector = await embeddingGenerator.GenerateEmbeddingAsync(query);

                var results = await _qdrantClient.SearchAsync(
                    collectionName,
                    vector.ToArray(),
                    limit: 5,
                    scoreThreshold: 0.3f
                );

                if (!results.Any()) return string.Empty;

                return string.Join("\n", results.Select(r => $"- {r.Payload["content"].StringValue}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to search knowledge base.");
                return string.Empty;
            }
        }
    }
}