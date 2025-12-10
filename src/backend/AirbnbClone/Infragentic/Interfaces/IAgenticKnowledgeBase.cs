namespace Infragentic.Interfaces
{
    public interface IAgenticKnowledgeBase
    {
        /// <summary>
        /// Upserts a list of raw text documents into the Vector DB.
        /// </summary>
        Task UpsertKnowledgeAsync(List<string> documents, string collectionName = "airbnb_knowledge");

        /// <summary>
        /// Searches the Vector DB for context relevant to the query.
        /// </summary>
        Task<string> SearchKnowledgeAsync(string query, string collectionName = "airbnb_knowledge");
    }
}