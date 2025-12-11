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
        [Description("Executes a SQL SELECT query. Automatic security filters apply.")]
        public async Task<string> ExecuteSqlQueryAsync(
            Kernel kernel,
            [Description("The T-SQL SELECT query to execute.")] string query,
            [Description("The current user's ID")] string currentUserId) // <--- REQUIRE THIS
        {
            // 1. SECURITY GUARD: The "Mandatory Filter" Check
            try
            {
                ValidateQuerySecurity(query, currentUserId);
            }
            catch (SecurityException ex)
            {
                // Return the error to the AI so it knows why it failed
                return $"SECURITY BLOCK: {ex.Message}. You MUST add 'WHERE HostId = ...' or 'WHERE GuestId = ...' to your query.";
            }

            // 2. EXECUTE
            return await _sqlExecutor.ExecuteReadOnlyQueryAsync(query, new Dictionary<string, object>());
        }

        private void ValidateQuerySecurity(string query, string userId)
        {
            // A. Definition of Private Data
            var sensitiveTables = new[] { "Bookings", "Listings", "Users", "Messages", "Conversations", "Notifications" };

            // Normalize for checking
            var upperQuery = query.ToUpperInvariant();

            // B. Check: Does this query touch private data?
            bool involvesSensitiveData = sensitiveTables.Any(table => upperQuery.Contains(table.ToUpperInvariant()));

            if (involvesSensitiveData)
            {
                // C. If it touches private data, IS THE USER ID PRESENT?
                // This is a crude but effective check. 
                // The AI *must* write the GUID string into the query for it to pass.

                // Guests (userId is null/empty) cannot query sensitive tables AT ALL.
                if (string.IsNullOrEmpty(userId))
                {
                    throw new SecurityException("Anonymous/Guest users cannot query restricted tables (Bookings, Users, etc).");
                }

                // Authenticated users MUST have their ID in the query string
                // Example: "... WHERE HostId = 'd0f526e8...'"
                if (!query.Contains(userId))
                {
                    throw new SecurityException($"Query rejected. You are accessing sensitive data but failed to filter by the Current User ID ({userId}). You MUST append a WHERE clause filtering by this ID.");
                }
            }
        }
    }

    // Helper Exception
    public class SecurityException : Exception { public SecurityException(string msg) : base(msg) { } }
}