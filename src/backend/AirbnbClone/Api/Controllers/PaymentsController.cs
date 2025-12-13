using Core.Interfaces;
using Application.DTOs;
using Application.DTOs.N8n;
using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public partial class PaymentsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;
        private readonly IConfiguration _configuration;

        // for n8n testing
        private readonly IN8nIntegrationService _n8nService;

        public PaymentsController(
            IUnitOfWork unitOfWork,
            IPaymentService paymentService,
            IConfiguration configuration,
            ILogger<PaymentsController> logger,
            IN8nIntegrationService n8nService)
        {
            _unitOfWork = unitOfWork;
            _paymentService = paymentService;
            _configuration = configuration;
            _logger = logger;
            _n8nService = n8nService;
        }

        /// <summary>
        /// Create a booking (pending) and return a Stripe Checkout session ID for payment.
        /// Authenticated guest only.
        /// </summary>
        [HttpPost("create-checkout-session")]
        [Authorize]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequestDto dto)
        {
            // 1. Basic Validation
            if (dto.EndDate <= dto.StartDate) return BadRequest("EndDate must be after StartDate.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(dto.ListingId);
            if (listing == null) return NotFound("Listing not found.");

            var nights = (dto.EndDate.Date - dto.StartDate.Date).Days;
            if (nights <= 0) return BadRequest("Invalid date range.");

            var available = await _unitOfWork.Bookings.IsListingAvailableAsync(listing.Id, dto.StartDate, dto.EndDate);
            if (!available) return Conflict("Listing is not available for the selected dates.");

            // 2. Calculate Price (Server-Side Source of Truth)
            var totalPrice = listing.PricePerNight * nights
                             + (listing.CleaningFee ?? 0m)
                             + (listing.ServiceFee ?? 0m);

            // 3. Create Pending Booking
            var booking = new Booking
            {
                ListingId = listing.Id,
                GuestId = userId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Guests = dto.Guests,
                TotalPrice = decimal.Round(totalPrice, 2),
                CleaningFee = listing.CleaningFee,
                ServiceFee = listing.ServiceFee,
                Status = BookingStatus.Pending,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Bookings.AddAsync(booking);
            await _unitOfWork.CompleteAsync();

            // 4. Build Stripe Metadata
            var metadata = new Dictionary<string, string>
            {
                ["bookingId"] = booking.Id.ToString(),
                ["listingId"] = listing.Id.ToString(),
                ["guestId"] = userId
            };

            var frontend = _configuration["ApplicationUrls:FrontendUrl"] ?? "http://localhost:4200";

            var successUrl = !string.IsNullOrWhiteSpace(dto.SuccessUrl)
                ? dto.SuccessUrl
                : $"{frontend}/payments/success?session_id={{CHECKOUT_SESSION_ID}}";

            var cancelUrl = !string.IsNullOrWhiteSpace(dto.CancelUrl)
                ? dto.CancelUrl
                : $"{frontend}/listings/{listing.Id}";

            // 5. Call Stripe Service
            var sessionResult = await _paymentService.CreateCheckoutSessionAsync(
                listing.Title ?? $"Listing #{listing.Id}",
                booking.TotalPrice,
                dto.Currency ?? listing.Currency ?? "egp",
                successUrl,
                cancelUrl,
                metadata);

            return Ok(new { sessionId = sessionResult.SessionId, sessionUrl = sessionResult.Url, bookingId = booking.Id });
        }

        /// <summary>
        /// Stripe webhook endpoint. Configure in Stripe dashboard (or Stripe CLI).
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook()
        {
            _logger.LogInformation("? Webhook endpoint HIT - reading request body...");

            string json;
            using (var reader = new StreamReader(Request.Body))
            {
                json = await reader.ReadToEndAsync();
            }

            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

            try
            {
                // This method now offloads the heavy processing to a background job internally.
                // It only verifies the signature synchronously.
                var eventType = await _paymentService.HandleWebhookAsync(json, signature ?? string.Empty);

                _logger.LogInformation("Stripe webhook accepted and processing queued: {Type}", eventType);
                return Ok(new { received = eventType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Stripe webhook");
                return BadRequest("Webhook Error");
            }
        }

        /// <summary>
        /// Cancel a pending booking when user abandons payment
        /// </summary>
        [HttpPost("cancel-pending-booking/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> CancelPendingBooking(int bookingId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null) return NotFound("Booking not found.");

            // Verify the booking belongs to this user
            if (booking.GuestId != userId) return Forbid();

            // Only cancel if it's still pending
            if (booking.Status == BookingStatus.Pending && booking.PaymentStatus == PaymentStatus.Pending)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.PaymentStatus = PaymentStatus.Failed;
                booking.CancelledAt = DateTime.UtcNow;
                booking.CancellationReason = "Payment cancelled by user";

                _unitOfWork.Bookings.Update(booking);
                await _unitOfWork.CompleteAsync();

                return Ok(new { message = "Pending booking cancelled successfully" });
            }

            return BadRequest("Booking cannot be cancelled (not pending)");
        }


        // an endpoit to test n8n integration
        [HttpPost("test-n8n-connection")]
        [AllowAnonymous] // So you don't need to login to test
        public async Task<IActionResult> TestN8nConnection()
        {
            _logger.LogInformation("?? Testing n8n connection manually...");

            // Create Mock Data (What Stripe/DB would usually provide)
            // add Longitude and Latitude values for NEW York
            var mockTripData = new TripBriefingDto
            {
                GuestName = "Karim Emad",
                GuestEmail = "karim20103200@gmail.com",

                City = "Istanbul",
                // Istanbul Coordinates (Critical for Weather API)
                Latitude = 41.0082f,
                Longitude = 28.9784f,

                CheckInDate = DateTime.UtcNow.AddDays(5),
                CheckOutDate = DateTime.UtcNow.AddDays(10),

                ListingTitle = "Historic Galata Tower Apartment",
                ListingAddress = "Bereketzade, Beyoglu/Istanbul, Turkey",

                // RAG Context (Simulated)
                HouseRules = "Please remove shoes before entering. No loud music after 11 PM. The roof terrace closes at midnight.",

                HostName = "Host Mehmet"
            };

            // Trigger the Workflow directly
            await _n8nService.TriggerTripPlannerWorkflowAsync(mockTripData);

            return Ok(new { message = "Test payload sent to n8n!", payload = mockTripData });
        }

        //create an endpoint to test the successful payment webhook processing
        [HttpPost("test-successful-payment")]
        [AllowAnonymous] // So you don't need to login to test
        public async Task<IActionResult> TestSuccessfulPaymentWebhook(string sessionId)
        {
            _logger.LogInformation("?? Testing successful payment webhook processing...");

            try
            {
                await _paymentService.ProcessSuccessfulPaymentAsync(sessionId);

                return Ok(new { message = "Successful payment processing simulated!", sessionId = sessionId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process successful payment simulation");
                return BadRequest("Simulation Error");
            }
    }
    }
    
}

