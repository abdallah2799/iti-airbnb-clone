using System.Threading.Tasks;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;

namespace Infrastructure.Repositories.Implementation
{
    public class AgentLogRepository : IAgentLogRepository
    {
        private readonly ApplicationDbContext _context;

        public AgentLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SaveLogAsync(AgentExecutionLog log)
        {
            await _context.AgentExecutionLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
    }
}