using System.Threading.Tasks;
using Application.DTOs.N8n;

namespace AirbnbClone.Core.Interfaces
{
    public interface IN8nIntegrationService
    {
        Task TriggerTripPlannerWorkflowAsync(TripBriefingDto data);
    }
}