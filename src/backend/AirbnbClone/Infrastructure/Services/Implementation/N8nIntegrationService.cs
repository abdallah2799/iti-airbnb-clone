using Application.DTOs.N8n;
using Application.Services.Interfaces;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace AirbnbClone.Infrastructure.Services.Implementation;

public class N8nIntegrationService : IN8nIntegrationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<N8nIntegrationService> _logger;

    public N8nIntegrationService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<N8nIntegrationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task TriggerTripPlannerWorkflowAsync(TripBriefingDto data)
    {
        try
        {
            var webhookUrl = _configuration["N8n:WebhookUrl"];
            if (string.IsNullOrEmpty(webhookUrl))
            {
                _logger.LogWarning("N8n Webhook URL not configured");
                return;
            }

            var response = await _httpClient.PostAsJsonAsync(webhookUrl, data);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation("Successfully triggered N8n workflow for guest {GuestEmail}", data.GuestEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering N8n workflow for guest {GuestEmail}", data.GuestEmail);
        }
    }
}
