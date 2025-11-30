using Application.DTOs.HostBookings; 

namespace Application.DTOs.HostListings
{
    public class HostReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; } // 1 to 5
        public string Comment { get; set; }
        public DateTime DatePosted { get; set; }

        public GuestDto Guest { get; set; }
    }
}

