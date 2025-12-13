using Core.Interfaces;
using Infragentic.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Infragentic.Services
{
    public class AgenticWorkflowService : IAgenticWorkflowService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITripEnrichmentService _tripEnrichment;
        private readonly Kernel _kernel;
        private readonly ILogger<AgenticWorkflowService> _logger;

        public AgenticWorkflowService(
            IUnitOfWork unitOfWork,
            ITripEnrichmentService tripEnrichment,
            Kernel kernel,
            ILogger<AgenticWorkflowService> logger)
        {
            _unitOfWork = unitOfWork;
            _tripEnrichment = tripEnrichment;
            _kernel = kernel;
            _logger = logger;
        }

        public async Task ExecuteTripPlannerWorkflowAsync(int bookingId)
        {
            _logger.LogInformation($"[Workflow] Starting Trip Planner for Booking {bookingId}...");

            // 1. GET BOOKING DATA
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null) return;

            // 2. PARALLEL DATA FETCH (Speed Optimization)
            var lat = booking.Listing.Latitude ?? 30.0444; // Default to Cairo if null
            var lon = booking.Listing.Longitude ?? 31.2357;

            var weatherTask = _tripEnrichment.GetWeatherForecastAsync(lat, lon, booking.StartDate, booking.EndDate);
            var eventsTask = _tripEnrichment.GetLocalEventsAsync(booking.Listing.City, booking.StartDate, booking.EndDate);

            await Task.WhenAll(weatherTask, eventsTask);

            // 3. CONSTRUCT PROMPT
            var prompt = $@"
    You are the AI Concierge for Airbnb Clone.
    
    ACTION:
    Write a warm 'Trip Briefing' email for the guest and SEND it using 'send_trip_briefing_email'.
    
    GUEST INFO:
    Name: {booking.Guest.FullName ?? booking.Guest.UserName}
    Email: {booking.Guest.Email}
    City: {booking.Listing.City}
    
    DATA:
    - Weather: {await weatherTask}
    - Events: {await eventsTask}
    - House Rules: {booking.Listing.Description}
    
    CONTENT INSTRUCTIONS:
    - Subject: Create a catchy subject line.
    - Body: Use HTML tags for formatting (<h3>, <p>, <ul>, <li>, <strong>).
    - CRITICAL: Do NOT use <html>, <head>, <body>, or style tags. Your content will be inserted into a template automatically.
    - Structure: 
        1. Warm Welcome.
        2. Weather Outlook (Brief).
        3. Top 3 Recommended Events (from data).
        4. Quick check on House Rules.
    
    Execute the tool immediately.
";

            // 4. INVOKE (Auto Tool Call)
            OpenAIPromptExecutionSettings settings = new()
            {
                ServiceId = "FastBrain",
                ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
            };

            await _kernel.InvokePromptAsync(prompt, new KernelArguments(settings));

            _logger.LogInformation($"[Workflow] Trip Plan sent to {booking.Guest.Email}");
        }
    }
}