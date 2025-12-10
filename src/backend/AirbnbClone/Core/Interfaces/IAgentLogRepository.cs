using System.Threading.Tasks;
using Core.Entities;

namespace Core.Interfaces
{
    public interface IAgentLogRepository
    {
        Task SaveLogAsync(AgentExecutionLog log);
    }
}