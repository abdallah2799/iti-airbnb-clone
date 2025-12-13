using Application.DTOs;

namespace Application.Services.Interfaces;

/// <summary>
/// Payment service interface for Stripe integration (Sprint 2)
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Story: [M] Securely Pay for Booking
    /// Create Stripe checkout session for booking payment
    /// </summary>
    /// <param name="listingTitle">Listing title for payment description</param>
    /// <param name="amount">Payment amount in major currency units (e.g., 10.50 for $10.50)</param>
    /// <param name="currency">Currency code (e.g., "usd")</param>
    /// <param name="successUrl">URL to redirect after successful payment</param>
    /// <param name="cancelUrl">URL to redirect if payment cancelled</param>
    /// <param name="metadata">Additional metadata (booking info, user id, etc.)</param>
    /// <returns>Stripe checkout session ID</returns>
    Task<CheckoutSessionResultDto> CreateCheckoutSessionAsync(
        string listingTitle,
        decimal amount,
        string currency,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata);

    /// <summary>
    /// Story: [M] Receive Booking Confirmation
    /// Handle Stripe webhook events (payment succeeded, failed, etc.)
    /// </summary>
    /// <param name="json">Webhook JSON payload</param>
    /// <param name="signature">Stripe signature header</param>
    /// <returns>Event type processed</returns>
    Task<string> HandleWebhookAsync(string json, string signature);

    /// <summary>
    /// Process successful payment and create booking
    /// </summary>
    /// <param name="sessionId">Stripe session ID</param>
    Task ProcessSuccessfulPaymentAsync(string sessionId);

    /// <summary>
    /// Get payment intent details
    /// </summary>
    /// <param name="paymentIntentId">Payment intent ID</param>
    /// <returns>Payment details</returns>
    Task<object> GetPaymentDetailsAsync(string paymentIntentId);

    /// <summary>
    /// Cancel a pending booking when Stripe session expires
    /// </summary>
    /// <param name="bookingId">Booking ID to cancel</param>
    Task CancelExpiredBookingAsync(int bookingId);
}


