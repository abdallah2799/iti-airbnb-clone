using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public int? CleanlinessRating { get; set; }
        public int? AccuracyRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? CheckInRating { get; set; }
        public int? ValueRating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime DatePosted { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string GuestAvatar { get; set; } = string.Empty;
    }

    public class UpdateReviewDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [Range(1, 5, ErrorMessage = "Cleanliness rating must be between 1 and 5")]
        public int? CleanlinessRating { get; set; }

        [Range(1, 5, ErrorMessage = "Accuracy rating must be between 1 and 5")]
        public int? AccuracyRating { get; set; }

        [Range(1, 5, ErrorMessage = "Communication rating must be between 1 and 5")]
        public int? CommunicationRating { get; set; }

        [Range(1, 5, ErrorMessage = "Location rating must be between 1 and 5")]
        public int? LocationRating { get; set; }

        [Range(1, 5, ErrorMessage = "Check-in rating must be between 1 and 5")]
        public int? CheckInRating { get; set; }

        [Range(1, 5, ErrorMessage = "Value rating must be between 1 and 5")]
        public int? ValueRating { get; set; }

        [Required(ErrorMessage = "Comment is required")]
        [StringLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
        public string Comment { get; set; } = string.Empty;
    }

    public class DeleteReviewDto
    {
        [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        public string Reason { get; set; } = string.Empty;
    }

}


