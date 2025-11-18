using Application.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Application.Services.Implementation;

public class MessagingService : IMessagingService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<MessagingService> _logger;

    public MessagingService(IEmailService emailService, ILogger<MessagingService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public Task<int> CreateOrGetConversationAsync(string guestId, string hostId, int listingId)
    {
        throw new NotImplementedException();
    }

    public Task<object> GetConversationMessagesAsync(int conversationId)
    {
        throw new NotImplementedException();
    }

    public Task<object> GetUserConversationsAsync(string userId)
    {
        throw new NotImplementedException();
    }

    public Task MarkAsReadAsync(List<int> messageIds, string userId)
    {
        throw new NotImplementedException();
    }

    public async Task SendBookingConfirmationAsync(string toEmail, object bookingDetails)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Attempted to send booking confirmation with empty recipient email.");
            return;
        }

        try
        {
            _logger.LogInformation("Sending booking confirmation to {Email}", toEmail);

            // Build readable HTML content from bookingDetails (works for Booking entity or anonymous object)
            var html = new StringBuilder();
            html.Append("<h1>Your Booking is Confirmed!</h1>");

            if (bookingDetails == null)
            {
                html.Append("<p>Booking details are not available.</p>");
            }
            else
            {
                // If bookingDetails is a known Booking object, use properties directly
                if (bookingDetails is Core.Entities.Booking b)
                {
                    html.Append($"<p>Booking ID: <strong>{b.Id}</strong></p>");
                    html.Append($"<p>Listing ID: <strong>{b.ListingId}</strong></p>");
                    html.Append($"<p>Start: <strong>{b.StartDate:yyyy-MM-dd}</strong></p>");
                    html.Append($"<p>End: <strong>{b.EndDate:yyyy-MM-dd}</strong></p>");
                    html.Append($"<p>Total: <strong>{b.TotalPrice:C}</strong></p>");
                }
                else
                {
                    // Fallback: reflect properties of anonymous object to build a table
                    var props = bookingDetails.GetType().GetProperties();
                    html.Append("<table>");
                    foreach (var p in props)
                    {
                        var val = p.GetValue(bookingDetails)?.ToString() ?? string.Empty;
                        html.Append($"<tr><td><strong>{p.Name}</strong></td><td>{System.Net.WebUtility.HtmlEncode(val)}</td></tr>");
                    }
                    html.Append("</table>");
                }
            }

            var subject = "Your Booking is Confirmed!";
            var sent = await _emailService.SendEmailAsync(toEmail, subject, html.ToString());
            if (!sent)
            {
                _logger.LogWarning("SendBookingConfirmationAsync: failed to send email to {Email}", toEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending booking confirmation to {Email}", toEmail);
        }
    }

    public Task<int> SendMessageAsync(int conversationId, string senderId, string content)
    {
        throw new NotImplementedException();
    }
}