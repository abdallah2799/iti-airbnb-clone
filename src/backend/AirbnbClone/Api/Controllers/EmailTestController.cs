using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/email-test")]
    public class EmailTestController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailTestController> _logger;

        public EmailTestController(IEmailService emailService, ILogger<EmailTestController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        // One-off endpoint to quickly verify SendGrid integration
        // Example: GET /api/email-test/send?to=you@example.com&subject=Hello&content=Hi
        [HttpGet("send")]
        public async Task<IActionResult> Send([FromQuery] string to, [FromQuery] string subject = "Test Email from AirbnbClone", [FromQuery] string content = "This is a test email sent via SendGrid integration.")
        {
            if (string.IsNullOrWhiteSpace(to))
            {
                return BadRequest("Query parameter 'to' is required.");
            }

            var sent = await _emailService.SendEmailAsync(to, subject, content);
            if (sent)
            {
                _logger.LogInformation("EmailTestController: sent test email to {To}", to);
                return Ok(new { message = "Email sent successfully", to, subject });
            }

            _logger.LogWarning("EmailTestController: failed to send test email to {To}", to);
            return StatusCode(502, new { message = "Failed to send email. Check logs for details." });
        }
    }
}

