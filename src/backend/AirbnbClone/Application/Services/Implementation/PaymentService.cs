using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;
using Application.DTOs;
using AirbnbClone.Infrastructure.Services.Interfaces;
using Application.DTOs.Bookings;

namespace AirbnbClone.Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly ILogger<PaymentService> _logger;
        private readonly string _stripeSecretKey;
        private readonly string? _webhookSecret;
        private readonly IBackgroundJobService _jobService; // The Abstraction

        public PaymentService(
            IConfiguration configuration,
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            ILogger<PaymentService> logger,
            IBackgroundJobService jobService)
        {
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _logger = logger;
            _jobService = jobService;

            _stripeSecretKey = _configuration["Stripe:SecretKey"]
                               ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY")
                               ?? throw new InvalidOperationException("Stripe secret key not configured.");
            _webhookSecret = _configuration["Stripe:WebhookSecret"];

            StripeConfiguration.ApiKey = _stripeSecretKey;
        }

        public async Task<CheckoutSessionResultDto> CreateCheckoutSessionAsync(
            string listingTitle,
            decimal amount,
            string currency,
            string successUrl,
            string cancelUrl,
            Dictionary<string, string> metadata)
        {
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
            
            return new CheckoutSessionResultDto
            {
                SessionId = session.Id!,
                Url = session.Url
            };
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
                    _logger.LogWarning("Stripe webhook secret not configured. Parsing without verification.");
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
                throw; // Important: Throwing 500 tells Stripe to retry later
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
                
                if (session == null || session.Metadata == null || !session.Metadata.ContainsKey("bookingId"))
                {
                    _logger.LogWarning("ProcessSuccessfulPaymentAsync: Valid session or bookingId not found for {SessionId}", sessionId);
                    return;
                }

                if (!int.TryParse(session.Metadata["bookingId"], out var bookingId))
                {
                    _logger.LogWarning("ProcessSuccessfulPaymentAsync: Invalid bookingId metadata.");
                    return;
                }

                var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
                
                if (booking == null)
                {
                    _logger.LogWarning("ProcessSuccessfulPaymentAsync: Booking {BookingId} not found in DB.", bookingId);
                    return;
                }

                // Update booking
                booking.StripePaymentIntentId = session.PaymentIntentId;
                booking.PaidAt = DateTime.UtcNow;
                booking.PaymentStatus = PaymentStatus.Completed;
                booking.Status = BookingStatus.Confirmed;

                await _unitOfWork.CompleteAsync();

                // Notify guest by email via Background Job
                var guestEmail = booking.Guest?.Email;
                
                if (!string.IsNullOrEmpty(guestEmail))
                {
                    // BEST PRACTICE: Use a concrete DTO/Class instead of an anonymous object.
                    // Anonymous objects can cause serialization issues in Hangfire.
                    var bookingDto = new BookingDto 
                    {
                        Id = booking.Id,
                        ListingId = booking.ListingId,
                        StartDate = booking.StartDate,
                        EndDate = booking.EndDate,
                        TotalPrice = booking.TotalPrice
                    };

                    _jobService.Enqueue(() => _emailService.SendBookingConfirmationEmailAsync(guestEmail, bookingDto));
                }
                
                _logger.LogInformation("Processed successful payment for booking {BookingId}", bookingId);
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
            return await service.GetAsync(paymentIntentId);
        }
    }
}