using System;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class AdminDashboardDto
{
    // ===== USER STATS =====
    public int TotalUsers { get; set; }
    public int TotalSuspendedUsers { get; set; }
    public int TotalActiveUsers { get; set; }
    public int TotalConfirmedUsers { get; set; }
    public int TotalUnconfirmedUsers { get; set; }

    // ===== BOOKING STATS =====
    public int TotalBookings { get; set; }
    public int TotalPendingBookings { get; set; }
    public int TotalConfirmedBookings { get; set; }
    public int TotalCancelledBookings { get; set; }

    // ===== LISTING STATS =====
    public int TotalListings { get; set; }
    public int TotalDraftListings { get; set; }
    public int TotalPublishedListings { get; set; }
    public int TotalInactiveListings { get; set; }
    public int TotalSuspendedListings { get; set; }
    public int TotalUnderReviewListings { get; set; }
    public int UnverifiedListingsCount { get; set; }

    // ===== RECENT ACTIVITY (max 5–10 items) =====
    public List<RecentBookingDto> RecentBookings { get; set; } = new();
    public List<RecentListingDto> RecentListings { get; set; } = new();

    // ===== TIME SERIES =====
    public int[] MonthlyNewUsers { get; set; } = Array.Empty<int>();
    public int[] MonthlyNewListings { get; set; } = Array.Empty<int>();
    public int[] MonthlyNewBookings { get; set; } = Array.Empty<int>();
}

public class RecentBookingDto
{
    public string Id { get; set; } = string.Empty;
    public string GuestName { get; set; } = "Guest";
    public string ListingTitle { get; set; } = "Listing";
    public DateTime BookingDate { get; set; }
    public string Status { get; set; } = "Pending";
}

public class RecentListingDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = "New Listing";
    public string HostName { get; set; } = "Host";
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "Published";
}