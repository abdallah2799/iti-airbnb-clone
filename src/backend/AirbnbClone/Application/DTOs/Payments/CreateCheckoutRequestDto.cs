namespace Application.DTOs;


public class CreateCheckoutRequestDto
{
    public int ListingId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Guests { get; set; } = 1;
    public string? Currency { get; set; }
    public string? SuccessUrl { get; set; }
    public string? CancelUrl { get; set; }
}





