using Core.Enums;

namespace Core.Entities;

public class Booking
{
    public int Id { get; set; }
    
    // Booking Details
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Guests { get; set; }
    public BookingStatus Status { get; set; }
    
    // Pricing Breakdown
    public decimal TotalPrice { get; set; }
    public decimal? CleaningFee { get; set; }
    public decimal? ServiceFee { get; set; }
    
    // Payment Tracking (Enhanced - All nullable for MVP)
    public string? StripePaymentIntentId { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DateTime? PaidAt { get; set; }
    
    // Refund Information (nullable, only if cancelled)
    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? CancellationReason { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    // Foreign Keys
    public string GuestId { get; set; } = string.Empty;
    public int ListingId { get; set; }

    // Navigation Properties
    public ApplicationUser Guest { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
    public Review? Review { get; set; }
}
