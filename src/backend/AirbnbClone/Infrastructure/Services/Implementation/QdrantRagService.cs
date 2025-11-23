using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.SemanticKernel.Memory;
using AirbnbClone.Infrastructure.Services.Interfaces;

namespace AirbnbClone.Infrastructure.Services.Implementation
{
    // Helper class to map the JSON file
    public class FaqItem
    {
        public string Id { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
    }

    public class QdrantRagService : IKnowledgeBaseService
    {
#pragma warning disable SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private readonly ISemanticTextMemory _memory;
#pragma warning restore SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        private const string CollectionName = "airbnb-help"; // The table name in Qdrant
        private const string JsonFilePath = "knowledge.json"; // Path to your file

#pragma warning disable SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        public QdrantRagService(ISemanticTextMemory memory)
#pragma warning restore SKEXP0001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        {
            _memory = memory;
        }

        public async Task IngestKnowledgeAsync()
        {
            // 1. Read the JSON file
            if (!File.Exists(JsonFilePath))
                throw new FileNotFoundException("Could not find knowledge.json");

            var jsonContent = await File.ReadAllTextAsync(JsonFilePath);
            var faqItems = JsonSerializer.Deserialize<List<FaqItem>>(jsonContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            Console.WriteLine($"🔍 DIAGNOSTIC: Found {faqItems.Count} items in JSON. IDs: {string.Join(", ", faqItems.Select(i => i.Id))}");


            // 2. Save to Qdrant (Vector DB)
            foreach (var item in faqItems)
            {
                // We combine Question and Answer so the AI can search both
                var textToEmbed = $"Question: {item.Question} | Answer: {item.Answer}";

                Console.WriteLine($"Saving item {item.Id} to Memory...");
                await _memory.SaveInformationAsync(
                    collection: CollectionName,
                    text: textToEmbed,
                    id: item.Id,
                    description: item.Question // Useful metadata
                );
            }
        }
    }
}