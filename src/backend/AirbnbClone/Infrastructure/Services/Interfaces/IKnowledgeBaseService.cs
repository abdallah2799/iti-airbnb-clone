using System.Threading.Tasks;

namespace AirbnbClone.Infrastructure.Services.Interfaces
{
    public interface IKnowledgeBaseService
    {
        /// <summary>
        /// Reads the knowledge.json file and saves it into the Vector Database.
        /// </summary>
        Task IngestKnowledgeAsync();
    }
}