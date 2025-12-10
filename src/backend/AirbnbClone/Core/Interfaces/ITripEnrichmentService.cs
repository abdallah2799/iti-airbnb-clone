using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Interfaces
{
    public interface ITripEnrichmentService
    {
        public Task<string> GetWeatherForecastAsync(double lat, double lon, DateTime start, DateTime end);
        public Task<string> GetLocalEventsAsync(string city, DateTime start, DateTime end);

    }
}
