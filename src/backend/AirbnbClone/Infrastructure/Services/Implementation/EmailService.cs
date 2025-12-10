using Core.Interfaces;
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
            
            // Wrap content in the branded template
            var styledHtml = GetEmailTemplate(htmlContent);
            
            // Use the styled HTML for the HTML content, and the raw content (or stripped) for plain text
            // For now, we'll use the raw htmlContent for plain text to avoid sending the full HTML wrapper in plain text view
            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, htmlContent, styledHtml);
            
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
        var message = $@"
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href='{resetLink}' class='btn' style='color: #ffffff;'>Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>";
        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendBookingConfirmationEmailAsync(string to, object bookingDetails)
    {
        var subject = "Booking Confirmation";
        var message = $@"
            <h2>Booking Confirmed!</h2>
            <p>Your booking has been successfully confirmed.</p>
            <p>Details: {bookingDetails}</p>";
        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendWelcomeEmailAsync(string to, string userName)
    {
        var subject = "Welcome to Airbnb Clone";
        var message = $@"
            <h2>Welcome, {userName}!</h2>
            <p>Thanks for joining our community. We're excited to have you on board.</p>
            <a href='#' class='btn' style='color: #ffffff;'>Start Exploring</a>";
        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendEmailConfirmationAsync(string to, string confirmationLink)
    {
        var subject = "Confirm Your Email Address";
        var message = $@"
        <p>Hi,</p>
        <p>Thanks for signing up! Please confirm your email address by clicking the link below:</p>
        <p><a href='{confirmationLink}' style='display:inline-block;padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:4px;'>Confirm Email</a></p>
        <p>If you didn’t create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Airbnb Clone Team</p>";

        return await SendEmailAsync(to, subject, message);
    }

    public async Task<bool> SendBookingCancellationEmailAsync(string to, string guestName, string listingTitle, DateTime startDate)
    {
        var subject = "Booking Cancelled";
        var message = $@"
            <h2>Booking Cancelled</h2>
            <p>Hi {guestName},</p>
            <p>Your booking for <strong>{listingTitle}</strong> on {startDate:MMM dd, yyyy} has been cancelled.</p>
            <p>We hope to see you again soon!</p>";
        return await SendEmailAsync(to, subject, message);
    }

    private string GetEmailTemplate(string bodyContent)
    {
        var brandColor = "#FF385C";
        var logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_Bélo.svg/2560px-Airbnb_Logo_Bélo.svg.png";
        
        return $@"
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset=""utf-8"">
          <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
          <style>
            body {{ margin: 0; padding: 0; background-color: #F7F7F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
            .wrapper {{ width: 100%; table-layout: fixed; background-color: #F7F7F7; padding-bottom: 40px; }}
            .main-table {{ background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; border: 1px solid #dddddd; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ padding: 24px; text-align: center; border-bottom: 1px solid #f0f0f0; }}
            .logo {{ width: 100px; height: auto; display: block; margin: 0 auto; }}
            .content {{ padding: 40px 32px; color: #484848; line-height: 1.6; font-size: 16px; }}
            .footer {{ background-color: #F7F7F7; padding: 20px; text-align: center; font-size: 12px; color: #717171; }}
            
            /* Typography overrides */
            h1, h2, h3 {{ color: #222222; margin-top: 20px; margin-bottom: 12px; }}
            b, strong {{ font-weight: 600; color: #222222; }}
            a {{ color: {brandColor}; text-decoration: none; font-weight: 600; }}
            ul {{ padding-left: 20px; margin-bottom: 20px; }}
            li {{ margin-bottom: 8px; }}
            .btn {{ display: inline-block; background-color: {brandColor}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class=""wrapper"">
            <br>
            <table class=""main-table"" cellpadding=""0"" cellspacing=""0"">
              <!-- HEADER -->
              <tr>
                <td class=""header"">
                  <img src=""{logoUrl}"" alt=""Airbnb"" class=""logo"">
                </td>
              </tr>
              
              <!-- CONTENT BODY -->
              <tr>
                <td class=""content"">
                  {bodyContent}
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td class=""footer"">
                  <p>Sent with ❤️ by the Airbnb Clone Team</p>
                  <p>Kafr Az-Zayyat, Gharbia Governorate, Egypt</p>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>";
    }
}
