using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class AgentExecutionLogConfiguration : IEntityTypeConfiguration<AgentExecutionLog>
    {
        public void Configure(EntityTypeBuilder<AgentExecutionLog> builder)
        {
            builder.ToTable("AgentExecutionLogs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.PluginName)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.FunctionName)
                .IsRequired()
                .HasMaxLength(200);

            // Storing JSON as max length string
            builder.Property(x => x.ArgumentsJson)
                .IsRequired(); // Even empty object {} is better than null

            // Indexing for performance
            // We often search for "Errors" or logs "By Date"
            builder.HasIndex(x => x.Timestamp);
            builder.HasIndex(x => x.IsError);
            builder.HasIndex(x => x.UserId);
        }
    }
}