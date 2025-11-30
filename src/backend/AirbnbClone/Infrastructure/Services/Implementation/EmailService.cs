using Application.Services.Interfaces;
using Core.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace AirbnbClone.Infrastructure.Services.Implementation;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
    {
        try
        {
            var apiKey = _configuration["SendGrid:ApiKey"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(_configuration["SendGrid:FromEmail"], _configuration["SendGrid:FromName"]);
            var toAddress = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, htmlContent, htmlContent);
            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to send email to {ToEmail}. Status Code: {StatusCode}", to, response.StatusCode);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception sending email to {ToEmail}", to);
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string to, string resetLink)
    {
        var subject = "Reset Your Password";
        var message = $"Please reset your password by clicking here: <a href='{resetLink}'>link</a>";
        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendBookingConfirmationEmailAsync(string to, object bookingDetails)
    {
        var subject = "Booking Confirmation";
        // Assuming bookingDetails is Booking entity or DTO, simplified for now
        var message = $"Your booking has been confirmed. Details: {bookingDetails}";
        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendWelcomeEmailAsync(string to, string userName)
    {
        var subject = "Welcome to Airbnb Clone";
        var message = $"Welcome {userName}, thanks for joining us!";
        return await SendEmailAsync(to, subject, message);
    }
}
