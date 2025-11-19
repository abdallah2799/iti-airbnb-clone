using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class ListingReviewsDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, double> RatingBreakdown { get; set; } = new();
        public List<ReviewDto> Reviews { get; set; } = new();
    }
}
