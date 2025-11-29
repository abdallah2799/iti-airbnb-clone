using System.Collections.Generic;
using System.Threading.Tasks;

namespace AirbnbClone.Infrastructure.Services.Interfaces
{
    public interface IAiAssistantService
    {
        /// <summary>
        /// Generates a list of attractive rental descriptions based on property details.
        /// </summary>
        /// <param name="propertyDetails">A string summarizing the property (e.g., "2-bed apartment in Cairo with Nile view")</param>
        /// <returns>A list of 5 distinct description variations.</returns>
        Task<List<string>> GenerateDescriptionsAsync(string propertyDetails);

        /// <summary>
        /// Takes a list of raw text documents (Listings, Rules), creates embeddings, 
        /// and saves them into the Vector Database (Qdrant).
        /// </summary>
        /// <param name="documents">The text content to be indexed.</param>
        Task UpdateKnowledgeBaseAsync(List<string> documents);

        /// <summary>
        /// The RAG Method: Searches Qdrant for context and asks the LLM to answer.
        /// </summary>
        /// <param name="question">The user's natural language question.</param>
        /// <returns>An AI-generated answer based on the knowledge base.</returns>
        Task<string> AnswerUserQuestionAsync(string question);
    }
}