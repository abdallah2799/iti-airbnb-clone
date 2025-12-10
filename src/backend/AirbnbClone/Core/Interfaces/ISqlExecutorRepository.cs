using System.Collections.Generic;
using System.Threading.Tasks;

namespace Core.Interfaces
{
    public interface ISqlExecutorRepository
    {
        Task<string> ExecuteReadOnlyQueryAsync(string query, Dictionary<string, object> parameters);
    }
}