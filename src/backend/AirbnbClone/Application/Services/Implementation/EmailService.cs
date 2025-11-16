using Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.Threading.Tasks;

namespace Application.Services.Implementation
{
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
            // Prefer hierarchical config; fall back to SENDGRID_API_KEY environment variable
            var apiKey = _configuration["SendGrid:ApiKey"]
                        ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            var fromEmail = _configuration["SendGrid:FromEmail"];
            var fromName = _configuration["SendGrid:FromName"];

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(fromEmail) || string.IsNullOrEmpty(fromName))
            {
                _logger.LogError("SendGrid configuration is missing.");
                return false;
            }

            try
            {
                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(fromEmail, fromName);
                var toAddress = new EmailAddress(to);
                var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, stripHtml(htmlContent), htmlContent);
                var response = await client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent to {To} with subject {Subject}", to, subject);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send email. Status code: {StatusCode}, Body: {Body}", response.StatusCode, await response.Body.ReadAsStringAsync());
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An exception occurred while sending an email.");
                return false;
            }
        }

        public Task<bool> SendPasswordResetEmailAsync(string to, string resetLink)
        {
            // TODO: Implement email template for password reset
            var subject = "Reset Your Password";
            var htmlContent = $"Please reset your password by clicking this link: <a href='{resetLink}'>Reset Password</a>";
            return SendEmailAsync(to, subject, htmlContent);
        }

        public Task<bool> SendBookingConfirmationEmailAsync(string to, object bookingDetails)
        {
            // TODO: Implement email template for booking confirmation
            var subject = "Your Booking is Confirmed!";
            var htmlContent = $"<h1>Booking Confirmed</h1><p>Details: {bookingDetails}</p>";
            return SendEmailAsync(to, subject, htmlContent);
        }

        public Task<bool> SendWelcomeEmailAsync(string to, string userName)
        {
            // TODO: Implement email template for welcome email
            var subject = $"Welcome to Airbnb Clone, {userName}!";
            var htmlContent = $"<h1>Welcome!</h1><p>Thanks for joining our platform.</p>";
            return SendEmailAsync(to, subject, htmlContent);
        }

        private string stripHtml(string html)
        {
            return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", String.Empty);
        }
    }
}
