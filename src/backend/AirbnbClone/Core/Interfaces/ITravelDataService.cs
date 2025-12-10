using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.DTOs.TripPlanner;

namespace Core.Interfaces
{
    public interface ITravelDataService
    {
        public  Task<List<HotelRecommendationDto>> GetHotelRecommendationsAsync(TripSearchCriteriaDto criteria);
    }
}
