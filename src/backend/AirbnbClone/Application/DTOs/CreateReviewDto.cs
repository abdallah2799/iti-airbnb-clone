using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class CreateReviewDto
    {
        public int Rating { get; set; }
        public int? CleanlinessRating { get; set; }
        public int? AccuracyRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? CheckInRating { get; set; }
        public int? ValueRating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public int BookingId { get; set; }
        public int ListingId { get; set; }
    }

}
