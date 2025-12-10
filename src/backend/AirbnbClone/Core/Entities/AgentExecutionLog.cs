using System;
using System.ComponentModel.DataAnnotations;

namespace Core.Entities
{
    public class AgentExecutionLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Who triggered the agent? (Null for anonymous/system jobs)
        public string? UserId { get; set; }

        // Which Plugin/Function was called? (e.g., "HostAssistantPlugin", "GetMyEarnings")
        [Required]
        [MaxLength(200)]
        public string PluginName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string FunctionName { get; set; } = string.Empty;

        // What did the user ask? (Or what arguments were passed?)
        public string ArgumentsJson { get; set; } = string.Empty;

        // What was the result?
        public string ResultJson { get; set; } = string.Empty;

        // Did it fail?
        public bool IsError { get; set; }
        public string? ErrorMessage { get; set; }

        // Performance metrics
        public double ExecutionDurationMs { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}