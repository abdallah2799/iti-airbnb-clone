using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace AirbnbClone.Infrastructure.Services.Implementation;

public class PaymentService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PaymentService> _logger;
    private readonly IEmailService _emailService;
    private readonly IBackgroundJobService _backgroundJobService;

    // THE NEW AGENTIC WORKFLOW SERVICE
    private readonly IAgenticWorkflowService _agenticWorkflow;

    public PaymentService(
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        ILogger<PaymentService> logger,
        IEmailService emailService,
        IBackgroundJobService backgroundJobService,
        IAgenticWorkflowService agenticWorkflow) // <--- Inject the Workflow Engine
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _emailService = emailService;
        _backgroundJobService = backgroundJobService;
        _agenticWorkflow = agenticWorkflow;

        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }

    public async Task<CheckoutSessionResultDto> CreateCheckoutSessionAsync(
        string listingTitle,
        decimal amount,
        string currency,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata)
    {
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(amount * 100),
                        Currency = currency,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Booking for {listingTitle}",
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            Metadata = metadata
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return new CheckoutSessionResultDto
        {
            SessionId = session.Id,
            Url = session.Url
        };
    }

    public async Task<string> HandleWebhookAsync(string json, string signature)
    {
        var endpointSecret = _configuration["Stripe:WebhookSecret"];
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, signature, endpointSecret);

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;
                if (session != null)
                {
                    // Fast return to Stripe (200 OK)
                    // The heavy lifting happens in the background job
                    _backgroundJobService.Enqueue<IPaymentService>(x => x.ProcessSuccessfulPaymentAsync(session.Id));
                }
            }
            else if (stripeEvent.Type == "checkout.session.expired")
            {
                // Handle expired checkout sessions - cancel the pending booking
                var session = stripeEvent.Data.Object as Session;
                if (session != null && session.Metadata.TryGetValue("bookingId", out var bookingIdStr) && int.TryParse(bookingIdStr, out var bookingId))
                {
                    _backgroundJobService.Enqueue<IPaymentService>(x => x.CancelExpiredBookingAsync(bookingId));
                }
            }

            return stripeEvent.Type;
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe Webhook Error");
            throw;
        }
    }

    public async Task ProcessSuccessfulPaymentAsync(string sessionId)
    {
        var service = new SessionService();
        var session = await service.GetAsync(sessionId);

        if (session.PaymentStatus == "paid")
        {
            if (session.Metadata.TryGetValue("bookingId", out var bookingIdStr) && int.TryParse(bookingIdStr, out var bookingId))
            {
                var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

                if (booking != null)
                {
                    // 1. Update Database Status
                    booking.PaymentStatus = PaymentStatus.Completed;
                    booking.Status = BookingStatus.Confirmed;
                    booking.StripePaymentIntentId = session.PaymentIntentId;

                    _unitOfWork.Bookings.Update(booking);
                    await _unitOfWork.CompleteAsync();

                    // 2. Send Immediate Receipt (Standard System Email)
                    // This is the boring "Receipt" email.
                    await _emailService.SendBookingConfirmationEmailAsync(booking.Guest.Email!, booking);

                    // 3. Trigger The Autonomous Agent (The "Trip Planner")
                    // The Agent will: 
                    //    -> Wake up in the background
                    //    -> Fetch Weather & Events in parallel
                    //    -> Check RAG for house rules
                    //    -> Write a custom HTML email
                    //    -> Send it via EmailPlugin
                    _backgroundJobService.Enqueue<IAgenticWorkflowService>(x => x.ExecuteTripPlannerWorkflowAsync(booking.Id));
                }
            }
        }
    }

    public async Task<object> GetPaymentDetailsAsync(string paymentIntentId)
    {
        var service = new PaymentIntentService();
        return await service.GetAsync(paymentIntentId);
    }

    public async Task CancelExpiredBookingAsync(int bookingId)
    {
        try
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

            if (booking != null && booking.Status == BookingStatus.Pending && booking.PaymentStatus == PaymentStatus.Pending)
            {
                // Cancel the booking since the Stripe session expired
                booking.Status = BookingStatus.Cancelled;
                booking.PaymentStatus = PaymentStatus.Failed;
                booking.CancelledAt = DateTime.UtcNow;
                booking.CancellationReason = "Payment session expired";

                _unitOfWork.Bookings.Update(booking);
                await _unitOfWork.CompleteAsync();

                _logger.LogInformation("Cancelled expired booking {BookingId} due to Stripe session expiration", bookingId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling expired booking {BookingId}", bookingId);
        }
    }
}