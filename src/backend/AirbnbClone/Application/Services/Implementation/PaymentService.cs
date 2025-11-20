using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace Application.Services.Implementation;

public class PaymentService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMessagingService _messaging;
    private readonly ILogger<PaymentService> _logger;
    private readonly string _stripeSecretKey;
    private readonly string? _webhookSecret;

    public PaymentService(
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        IMessagingService messaging,
        ILogger<PaymentService> logger)
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _messaging = messaging;
        _logger = logger;

        _stripeSecretKey = _configuration["Stripe:SecretKey"]
                           ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY")
                           ?? throw new InvalidOperationException("Stripe secret key not configured.");
        _webhookSecret = _configuration["Stripe:WebhookSecret"]; // optional - configure in appsettings for webhook verification

        StripeConfiguration.ApiKey = _stripeSecretKey;
    }

    public async Task<string> CreateCheckoutSessionAsync(
        string listingTitle,
        decimal amount,
        string currency,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata)
    {
        // amount is provided in currency units (e.g., 10.50) -> convert to cents for Stripe (long)
        var unitAmount = (long)Math.Round(amount * 100m);
        if (unitAmount <= 0) throw new ArgumentException("Amount must be greater than zero.", nameof(amount));

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            Mode = "payment",
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = unitAmount,
                        Currency = currency,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = listingTitle
                        }
                    },
                    Quantity = 1
                }
            },
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            Metadata = metadata
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        _logger.LogInformation("Created Stripe checkout session {SessionId} for listing {Listing}", session.Id, listingTitle);
        return session.Id!;
    }

    public async Task<string> HandleWebhookAsync(string json, string signature)
    {
        try
        {
            Event stripeEvent;

            if (!string.IsNullOrEmpty(_webhookSecret) && !string.IsNullOrEmpty(signature))
            {
                stripeEvent = EventUtility.ConstructEvent(json, signature, _webhookSecret);
            }
            else
            {
                stripeEvent = EventUtility.ParseEvent(json);
                _logger.LogWarning("Stripe webhook secret not configured. Received webhook parsed without signature verification.");
            }

            _logger.LogInformation("Received Stripe webhook event: {Type}", stripeEvent.Type);

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;
                if (session != null)
                {
                    await ProcessSuccessfulPaymentAsync(session.Id!);
                }
            }
            else if (stripeEvent.Type == "payment_intent.succeeded")
            {
                var pi = stripeEvent.Data.Object as PaymentIntent;
                if (pi != null)
                {
                    _logger.LogInformation("PaymentIntent succeeded: {Id}", pi.Id);
                }
            }

            return stripeEvent.Type;
        }
        catch (StripeException sx)
        {
            _logger.LogError(sx, "Stripe webhook verification/processing failed.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle Stripe webhook.");
            throw;
        }
    }

    public async Task ProcessSuccessfulPaymentAsync(string sessionId)
    {
        try
        {
            var sessionService = new SessionService();
            var session = await sessionService.GetAsync(sessionId, new SessionGetOptions { Expand = new List<string> { "payment_intent", "customer" } });
            if (session == null)
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: session {SessionId} not found.", sessionId);
                return;
            }

            var paymentIntentId = session.PaymentIntentId;
            if (string.IsNullOrEmpty(paymentIntentId))
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: session {SessionId} has no PaymentIntentId.", sessionId);
            }

            // Expect metadata contains bookingId
            if (session.Metadata == null || !session.Metadata.ContainsKey("bookingId"))
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: session {SessionId} missing bookingId metadata.", sessionId);
                return;
            }

            if (!int.TryParse(session.Metadata["bookingId"], out var bookingId))
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: invalid bookingId metadata in session {SessionId}. Value: {Value}", sessionId, session.Metadata["bookingId"]);
                return;
            }

            _logger.LogInformation("Webhook: attempting to load booking ID {BookingId} from DB", bookingId);
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            _logger.LogInformation("Webhook: booking found = {Found}", booking != null);
            if (booking == null)
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: booking {BookingId} not found.", bookingId);
                return;
            }

            // Update booking with payment details and mark confirmed
            booking.StripePaymentIntentId = paymentIntentId;
            booking.PaidAt = DateTime.UtcNow;
            booking.PaymentStatus = PaymentStatus.Completed;
            booking.Status = BookingStatus.Confirmed;

            // Persist changes
            await _unitOfWork.CompleteAsync();

            // Notify guest by email
            var guestEmail = booking.Guest?.Email;
            if (!string.IsNullOrEmpty(guestEmail))
            {
                var bookingDetails = new
                {
                    booking.Id,
                    booking.ListingId,
                    booking.StartDate,
                    booking.EndDate,
                    booking.TotalPrice
                };
                //await _messaging.SendBookingConfirmationAsync(guestEmail, bookingDetails);
            }
            else
            {
                _logger.LogWarning("ProcessSuccessfulPaymentAsync: Guest email not available for booking {BookingId}", bookingId);
            }

            _logger.LogInformation("Processed successful payment for booking {BookingId} (session {SessionId})", bookingId, sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing successful payment for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<object> GetPaymentDetailsAsync(string paymentIntentId)
    {
        if (string.IsNullOrEmpty(paymentIntentId))
            throw new ArgumentNullException(nameof(paymentIntentId));

        var service = new PaymentIntentService();
        var pi = await service.GetAsync(paymentIntentId);
        return pi;
    }
}