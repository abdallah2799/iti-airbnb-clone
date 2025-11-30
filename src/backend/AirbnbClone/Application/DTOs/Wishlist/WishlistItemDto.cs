using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Wishlist
{
    public class WishlistItemDto
    {
        public int ListingId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverPhotoUrl { get; set; }
        public decimal Price { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string Location { get; set; } = string.Empty;
        public DateTime AddedAt { get; set; }
    }
}


