using System.ComponentModel;
using Core.Interfaces;
using Microsoft.SemanticKernel;

namespace Infragentic.Plugins
{
    public class DatabaseQueryPlugin
    {
        private readonly ISqlExecutorRepository _sqlExecutor;

        public DatabaseQueryPlugin(ISqlExecutorRepository sqlExecutor)
        {
            _sqlExecutor = sqlExecutor;
        }

        [KernelFunction("execute_sql_query")]
        [Description("Executes a SQL SELECT query against the database to fetch data.")]
        public async Task<string> ExecuteSqlQueryAsync(
            Kernel kernel,
            [Description("The T-SQL SELECT query to execute.")] string query)
        {
            return await _sqlExecutor.ExecuteReadOnlyQueryAsync(query, new Dictionary<string, object>());
        }
    }
}