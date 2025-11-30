using System.Threading.Tasks;
using Application.DTOs.N8n;

namespace Application.Services.Interfaces
{
    public interface IN8nIntegrationService
    {
        Task TriggerTripPlannerWorkflowAsync(TripBriefingDto data);
    }
}

