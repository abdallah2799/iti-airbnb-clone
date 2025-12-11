using System.ComponentModel;
using System.Text.Json; // Required for parsing the Read result
using Core.Interfaces;
using Microsoft.SemanticKernel;

namespace Infragentic.Plugins
{
    public class BookingManagerPlugin
    {
        private readonly ISqlWriteExecutor _writer;       // To Update (Cancel)
        private readonly ISqlExecutorRepository _reader;  // To Fetch Email/Name
        private readonly IEmailService _emailService;     // To Send Email

        public BookingManagerPlugin(
            ISqlWriteExecutor writer,
            ISqlExecutorRepository reader,
            IEmailService emailService)
        {
            _writer = writer;
            _reader = reader;
            _emailService = emailService;
        }

        [KernelFunction("cancel_my_booking")]
        [Description("Cancels a specific booking and sends a confirmation email.")]
        public async Task<string> CancelBookingAsync(
            Kernel kernel,
            [Description("The Booking ID to cancel")] int bookingId,
            [Description("The current user's ID")] string currentUserId)
        {
            if (string.IsNullOrEmpty(currentUserId)) return "Error: You must be logged in.";

            // ---------------------------------------------------------
            // STEP 1: FETCH DETAILS (Who are we cancelling for?)
            // ---------------------------------------------------------
            // We join tables to get the Listing Title and Guest Email in one go.
            string selectSql = @"
                SELECT TOP 1 
                    b.Id, 
                    b.StartDate, 
                    u.Email, 
                    u.FullName, 
                    u.UserName,
                    l.Title AS ListingTitle
                FROM Bookings b
                JOIN Users u ON b.GuestId = u.Id
                JOIN Listings l ON b.ListingId = l.Id
                WHERE b.Id = @BookingId 
                  AND b.GuestId = @UserId
                  AND b.Status != 2; -- Ensure not already cancelled
            ";

            var readParams = new Dictionary<string, object>
            {
                { "@BookingId", bookingId },
                { "@UserId", currentUserId }
            };

            var jsonResult = await _reader.ExecuteReadOnlyQueryAsync(selectSql, readParams);

            // If query returned "No data found" or empty array
            if (jsonResult.Contains("No data") || jsonResult == "[]")
            {
                return $"Error: Booking #{bookingId} not found, does not belong to you, or is already cancelled.";
            }

            // Parse the JSON to get the variables
            string guestEmail = "";
            string guestName = "";
            string listingTitle = "";
            DateTime startDate = DateTime.MinValue;

            try
            {
                using (JsonDocument doc = JsonDocument.Parse(jsonResult))
                {
                    var root = doc.RootElement[0]; // Get first item
                    guestEmail = root.GetProperty("Email").GetString() ?? "";
                    guestName = root.GetProperty("FullName").GetString() ?? root.GetProperty("UserName").GetString() ?? "Guest";
                    listingTitle = root.GetProperty("ListingTitle").GetString() ?? "Property";
                    startDate = root.GetProperty("StartDate").GetDateTime();
                }
            }
            catch
            {
                return "Error parsing booking details.";
            }

            // ---------------------------------------------------------
            // STEP 2: EXECUTE CANCELLATION (The Write)
            // ---------------------------------------------------------
            string updateSql = @"
                UPDATE Bookings 
                SET Status = 2, -- Cancelled
                    CancelledAt = GETUTCDATE(),
                    CancellationReason = 'Cancelled by AI Agent request'
                WHERE Id = @BookingId; 
            ";

            // We reuse params since keys are same
            bool success = await _writer.ExecuteSafeUpdateAsync(updateSql, readParams, currentUserId);

            if (!success) return $"Failed to update Booking #{bookingId}.";

            // ---------------------------------------------------------
            // STEP 3: SEND EMAIL (The Notification)
            // ---------------------------------------------------------
            if (!string.IsNullOrEmpty(guestEmail))
            {
                await _emailService.SendBookingCancellationEmailAsync(
                    guestEmail,
                    guestName,
                    listingTitle,
                    startDate
                );
            }

            return $"Success: Booking #{bookingId} for '{listingTitle}' has been cancelled. A confirmation email has been sent to {guestEmail}.";
        }
    }
}