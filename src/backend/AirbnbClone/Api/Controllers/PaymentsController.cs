using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Core.Enums;
using Infrastructure.Repositories;
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

        public PaymentsController(
            IUnitOfWork unitOfWork,
            IPaymentService paymentService,
            IConfiguration configuration,
            ILogger<PaymentsController> logger)
        {
            _unitOfWork = unitOfWork;
            _paymentService = paymentService;
            _configuration = configuration;
            _logger = logger;
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
            _logger.LogInformation("✅ Webhook endpoint HIT - reading request body...");

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
    }
}