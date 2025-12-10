using Core.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories.Implementation
{
    public class SqlExecutorRepository : ISqlExecutorRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<SqlExecutorRepository> _logger;

        public SqlExecutorRepository(IConfiguration configuration, ILogger<SqlExecutorRepository> logger)
        {
            // Use the Read-Only connection string
            var readOnlyConn = configuration.GetConnectionString("AiReadOnlyConnection");
            _connectionString = !string.IsNullOrEmpty(readOnlyConn)
                ? readOnlyConn
                : configuration.GetConnectionString("DefaultConnection");

            _logger = logger;
        }

        public async Task<string> ExecuteReadOnlyQueryAsync(string query, Dictionary<string, object> parameters)
        {
            // 1. SAFETY GUARD: Block forbidden keywords
            var forbidden = new[] { "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "EXEC", "MERGE", "CREATE" };
            if (forbidden.Any(f => query.ToUpperInvariant().Contains(f)))
            {
                _logger.LogWarning($"AI attempted forbidden query: {query}");
                return "Error: Security Violation. You are in Read-Only mode.";
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    // 2. SAFETY GUARD: Inject TOP limit if missing
                    if (!query.ToUpperInvariant().Contains("TOP ") && !query.ToUpperInvariant().Contains("COUNT("))
                    {
                        var selectIndex = query.IndexOf("SELECT", StringComparison.OrdinalIgnoreCase);
                        if (selectIndex >= 0) query = query.Insert(selectIndex + 6, " TOP 20");
                    }

                    // 3. Execute with Dapper
                    var result = await connection.QueryAsync(query, parameters);

                    if (!result.Any()) return "No data found.";

                    // 4. Return as JSON
                    return System.Text.Json.JsonSerializer.Serialize(result);
                }
            }
            catch (SqlException ex)
            {
                return $"SQL Error: {ex.Message}";
            }
        }
    }
}