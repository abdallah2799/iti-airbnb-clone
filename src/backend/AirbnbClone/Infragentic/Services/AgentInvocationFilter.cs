using System.Diagnostics;
using System.Text.Json;
using Core.Entities;
using Core.Interfaces; // <--- Depends on Core, NOT Infrastructure
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;

namespace Infragentic.Services
{
    public class AgentInvocationFilter : IFunctionInvocationFilter
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public AgentInvocationFilter(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task OnFunctionInvocationAsync(FunctionInvocationContext context, Func<FunctionInvocationContext, Task> next)
        {
            var stopwatch = Stopwatch.StartNew();
            var safePluginName = string.IsNullOrEmpty(context.Function.PluginName)? "InlinePrompt" : context.Function.PluginName;
            var logEntry = new AgentExecutionLog
            {
                PluginName = safePluginName,
                FunctionName = context.Function.Name,
                ArgumentsJson = JsonSerializer.Serialize(context.Arguments),
                Timestamp = DateTime.UtcNow
            };

            // Try to capture UserId
            if (context.Arguments.TryGetValue("UserId", out var userIdObj))
            {
                logEntry.UserId = userIdObj?.ToString();
            }

            try
            {
                await next(context); // Run the AI function

                stopwatch.Stop();
                logEntry.IsError = false;
                logEntry.ResultJson = context.Result?.ToString() ?? "null";
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                logEntry.IsError = true;
                logEntry.ErrorMessage = ex.Message;
                throw;
            }
            finally
            {
                logEntry.ExecutionDurationMs = stopwatch.Elapsed.TotalMilliseconds;

                // Fire and forget using the Interface
                _ = Task.Run(async () => await SaveLogSafeAsync(logEntry));
            }
        }

        private async Task SaveLogSafeAsync(AgentExecutionLog log)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    // NOW we ask for the Interface, not the DbContext
                    var repo = scope.ServiceProvider.GetRequiredService<IAgentLogRepository>();
                    await repo.SaveLogAsync(log);
                }
            }
            catch (Exception ex)
            {
                // Fallback logging
                Console.WriteLine($"[AgentLogging Error] {ex.Message}");
            }
        }
    }
}