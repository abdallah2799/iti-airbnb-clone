using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infragentic.Interfaces; // <--- 1. NEW NAMESPACE
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
    private readonly IAgenticContentGenerator _agenticService; // <--- 2. CHANGED INTERFACE

    public PaymentService(
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        ILogger<PaymentService> logger,
        IEmailService emailService,
        IBackgroundJobService backgroundJobService,
        IN8nIntegrationService n8nService,
        IAgenticContentGenerator agenticService) // <--- 3. INJECT NEW SERVICE
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _emailService = emailService;
        _backgroundJobService = backgroundJobService;
        _n8nService = n8nService;
        _agenticService = agenticService;

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
                    // Enqueue the work to avoid timeouts
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

        if (session.PaymentStatus == "paid")
        {
            if (session.Metadata.TryGetValue("bookingId", out var bookingIdStr) && int.TryParse(bookingIdStr, out var bookingId))
            {
                var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

                if (booking != null)
                {
                    booking.PaymentStatus = PaymentStatus.Completed;
                    booking.Status = BookingStatus.Confirmed;
                    booking.StripePaymentIntentId = session.PaymentIntentId;

                    _unitOfWork.Bookings.Update(booking);
                    await _unitOfWork.CompleteAsync();

                    // 1. Send confirmation email
                    await _emailService.SendBookingConfirmationEmailAsync(booking.Guest.Email!, booking);

                    // 2. Prepare RAG Context
                    var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(booking.ListingId);
                    var houseRulesContext = listing?.Description ?? "No rules.";

                    // Enrich with AI (RAG) using the new Agentic Layer
                    try
                    {
                        var ragQuestion = $"What are the house rules for {listing?.Title}?";

                        // <--- 4. USE THE NEW METHOD AND SERVICE
                        var aiInsights = await _agenticService.AnswerQuestionWithRagAsync(ragQuestion);

                        if (!string.IsNullOrEmpty(aiInsights))
                            houseRulesContext += $"\n\nAI Notes: {aiInsights}";
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to enrich Trip Planner with AI context, proceeding with raw data.");
                    }

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