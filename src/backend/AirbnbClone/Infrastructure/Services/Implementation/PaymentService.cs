using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using AirbnbClone.Infrastructure.Services.Interfaces;
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
    private readonly IN8nIntegrationService _n8nService;
    private readonly IAiAssistantService _aiService;

    public PaymentService(
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        ILogger<PaymentService> logger,
        IEmailService emailService,
        IBackgroundJobService backgroundJobService,
        IN8nIntegrationService n8nService,
        IAiAssistantService aiService)
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _emailService = emailService;
        _backgroundJobService = backgroundJobService;
        _n8nService = n8nService;
        _aiService = aiService;

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
                    // --- FIX 1: ASYNC PROCESSING ---
                    // Instead of 'await', we Enqueue the work.
                    // This returns '200 OK' to Stripe instantly (solving timeouts).
                    // We use <IPaymentService> to avoid serializing "this".
                    _backgroundJobService.Enqueue<IPaymentService>(x => x.ProcessSuccessfulPaymentAsync(session.Id));
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

        // IMPORTANT: Check for "paid" status to avoid processing incomplete sessions
        if (session.PaymentStatus == "paid")
        {
            if (session.Metadata.TryGetValue("bookingId", out var bookingIdStr) && int.TryParse(bookingIdStr, out var bookingId))
            {
                // Use GetBookingWithDetailsAsync to ensure Guest/Host data is loaded
                var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
                
                if (booking != null)
                {
                    booking.PaymentStatus = PaymentStatus.Completed;
                    booking.Status = BookingStatus.Confirmed;
                    booking.StripePaymentIntentId = session.PaymentIntentId;
                    
                    _unitOfWork.Bookings.Update(booking);
                    await _unitOfWork.CompleteAsync();

                    // 1. Send confirmation email (Safe to enqueue a lambda here as services are usually static-like, 
                    // but using <T> is safer if it fails)
                    await _emailService.SendBookingConfirmationEmailAsync(booking.Guest.Email!, booking);

                    // 2. Prepare RAG Context
                    var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(booking.ListingId);
                    var houseRulesContext = listing?.Description ?? "No rules.";
                    
                    // Enrich with AI (RAG)
                    try 
                    {
                         var ragQuestion = $"What are the house rules for {listing?.Title}?";
                         var aiInsights = await _aiService.AnswerUserQuestionAsync(ragQuestion);
                         if(!string.IsNullOrEmpty(aiInsights)) houseRulesContext += $"\n\nAI Notes: {aiInsights}";
                    }
                    catch {}

                    // 3. Trigger N8n
                    var tripData = new global::Application.DTOs.N8n.TripBriefingDto
                    {
                        GuestName = booking.Guest.FullName ?? booking.Guest.UserName,
                        GuestEmail = booking.Guest.Email,
                        ListingTitle = booking.Listing.Title,
                        City = booking.Listing.City,
                        CheckInDate = booking.StartDate,
                        CheckOutDate = booking.EndDate,
                        HostName = booking.Listing.Host.FullName ?? booking.Listing.Host.UserName,
                        HouseRules = houseRulesContext
                    };
                    
                    // --- FIX 2: SAFE ENQUEUE ---
                    // Use <IN8nIntegrationService> to prevent "PaymentService" serialization crash.
                    _backgroundJobService.Enqueue<IN8nIntegrationService>(x => x.TriggerTripPlannerWorkflowAsync(tripData));
                }
            }
        }
    }

    public async Task<object> GetPaymentDetailsAsync(string paymentIntentId)
    {
        var service = new PaymentIntentService();
        return await service.GetAsync(paymentIntentId);
    }
}