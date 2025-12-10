using System.ComponentModel;
using Core.Interfaces;
using Microsoft.SemanticKernel;

namespace Infragentic.Plugins
{
    public class GuestCommunicationPlugin
    {
        private readonly IEmailService _emailService;

        public GuestCommunicationPlugin(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [KernelFunction("send_trip_briefing_email")]
        [Description("Sends the finalized HTML trip briefing to the guest.")]
        public async Task SendTripBriefingAsync(
            [Description("The guest's email address")] string email,
            [Description("The subject line")] string subject,
            [Description("The HTML body content (paragraphs, lists). DO NOT include <html> or <body> tags, just the inner content.")] string bodyContent)
        {
            // DIRECT CALL: Your EmailService already adds the <html> wrapper and logo.
            // We just pass the inner body content.
            await _emailService.SendEmailAsync(email, subject, bodyContent);
        }
    }
}