namespace Application.Services.Interfaces;

/// <summary>
/// Email service interface for sending emails (Sprint 0)
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Story: [M] Implement Email Service - Send email using SendGrid
    /// Used for password reset emails and booking confirmations
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlContent">HTML content of the email</param>
    /// <returns>True if email sent successfully</returns>
    Task<bool> SendEmailAsync(string to, string subject, string htmlContent);

    /// <summary>
    /// Story: [M] Forgot Password Request - Send password reset email
    /// </summary>
    /// <param name="to">User email</param>
    /// <param name="resetLink">Password reset link with token</param>
    Task<bool> SendPasswordResetEmailAsync(string to, string resetLink);

    /// <summary>
    /// Story: [M] Receive Booking Confirmation - Send booking confirmation email
    /// </summary>
    /// <param name="to">Guest email</param>
    /// <param name="bookingDetails">Booking information (dates, listing, price, etc.)</param>
    Task<bool> SendBookingConfirmationEmailAsync(string to, object bookingDetails);

    /// <summary>
    /// Send welcome email after successful registration
    /// </summary>
    Task<bool> SendWelcomeEmailAsync(string to, string userName);

    /// <summary>
    /// Send email confirmation link
    /// </summary>
    /// <param name="to"></param>
    /// <returns></returns>
    Task<bool> SendEmailConfirmationAsync(string to, string confirmationLink);

    Task<bool> SendBookingCancellationEmailAsync(string to, string guestName, string listingTitle, DateTime startDate);
}


