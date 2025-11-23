using System.Collections.Generic;
using System.Threading.Tasks;

namespace AirbnbClone.Infrastructure.Services.Interfaces
{
    public interface IAiAssistantService
    {
        /// <summary>
        /// Generates a list of attractive rental descriptions based on property details.
        /// </summary>
        /// <param name="propertyDetails">A string summarizing the property (e.g., "2-bed apartment in Cairo with Nile view")</param>
        /// <returns>A list of 5 distinct description variations.</returns>
        Task<List<string>> GenerateDescriptionsAsync(string propertyDetails);
    }
}