using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using AirbnbClone.Core.Interfaces;
using Application.DTOs.N8n;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AirbnbClone.Infrastructure.Services
{
    public class N8nIntegrationService : IN8nIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _webhookUrl;
        private readonly ILogger<N8nIntegrationService> _logger;

        public N8nIntegrationService(
            HttpClient httpClient, 
            IConfiguration configuration,
            ILogger<N8nIntegrationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            
            // We will add this to appsettings.json
            _webhookUrl = configuration["N8n:WebhookUrl"] 
                          ?? throw new ArgumentNullException("N8n Webhook URL is missing");
        }

        public async Task TriggerTripPlannerWorkflowAsync(TripBriefingDto data)
        {
            try
            {
                _logger.LogInformation("Triggering n8n Trip Planner for {Guest} in {City}...", data.GuestName, data.City);
                
                var response = await _httpClient.PostAsJsonAsync(_webhookUrl, data);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("n8n Webhook failed with status: {Status}", response.StatusCode);
                }
                else 
                {
                    _logger.LogInformation("n8n Workflow triggered successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reaching n8n.");
                // We don't throw here to avoid crashing the Hangfire job entirely, 
                // unless you want retries. If you want retries, uncomment `throw;`
                // throw; 
            }
        }
    }
}