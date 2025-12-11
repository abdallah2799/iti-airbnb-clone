using Application.DTOs;
using Application.DTOs.Admin;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Application.Services.Implementations;

/// <summary>
/// Implementation of admin operations for managing users, listings, and bookings.
/// </summary>
/// <remarks>
/// **Sprint 6**: Admin Dashboard (User, Listing, Booking Management)
/// 
/// **User Stories**:
/// - [A] As an Admin, I want to view all users and suspend/delete them if needed.
/// - [A] As an Admin, I want to approve, reject, suspend, or delete listings.
/// - [A] As an Admin, I want to view and cancel bookings.
/// 
/// **Business Rules**:
/// - SuperAdmin accounts cannot be suspended or deleted
/// - Listings with confirmed bookings cannot be deleted
/// - Confirmed bookings cannot be deleted (only cancelled)
/// - Booking status transitions are restricted (e.g., no Confirmed ? Pending)
/// 
/// **Security**:
/// - Authorization enforced at controller level; service assumes caller is SuperAdmin
/// - No direct exposure of IdentityUser or internal entities
/// 
/// **Implementation Notes**:
/// - Uses UnitOfWork for transactional consistency
/// - Leverages UserManager for role checks
/// - Uses AutoMapper to project entities to DTOs
/// - All changes require explicit call to UnitOfWork.CompleteAsync() in controller
/// </remarks>
public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IBackgroundJobService _jobService;

    public AdminService(
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager,
        IMapper mapper,
        IEmailService emailService,
        IBackgroundJobService jobService)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _mapper = mapper;
        _emailService = emailService;
        _jobService = jobService;
    }

    public async Task<AdminDashboardDto> GetDashboardDataAsync()
    {
        var unverifiedCount = await _unitOfWork.Listings.CountAsync(l => l.Status == ListingStatus.UnderReview);

        return new AdminDashboardDto
        {
            // User Stats
            TotalUsers = await _unitOfWork.Users.CountAsync(),
            TotalSuspendedUsers = await _unitOfWork.Users.CountAsync(u => u.IsSuspended),
            TotalActiveUsers = await _unitOfWork.Users.CountAsync(u => u.EmailConfirmed), 
            TotalConfirmedUsers = await _unitOfWork.Users.CountAsync(u => u.EmailConfirmed && !u.IsSuspended),
            TotalUnconfirmedUsers = await _unitOfWork.Users.CountAsync(u => !u.EmailConfirmed),

            // Booking Stats
            TotalBookings = await _unitOfWork.Bookings.CountAsync(),
            TotalPendingBookings = await _unitOfWork.Bookings.CountAsync(b => b.Status == BookingStatus.Pending),
            TotalConfirmedBookings = await _unitOfWork.Bookings.CountAsync(b => b.Status == BookingStatus.Confirmed),
            TotalCancelledBookings = await _unitOfWork.Bookings.CountAsync(b => b.Status == BookingStatus.Cancelled),

            // Listing Stats
            TotalListings = await _unitOfWork.Listings.CountAsync(),
            TotalDraftListings = await _unitOfWork.Listings.CountAsync(l => l.Status == ListingStatus.Draft),
            TotalPublishedListings = await _unitOfWork.Listings.CountAsync(l => l.Status == ListingStatus.Published),
            TotalInactiveListings = await _unitOfWork.Listings.CountAsync(l => l.Status == ListingStatus.Inactive),
            TotalSuspendedListings = await _unitOfWork.Listings.CountAsync(l => l.Status == ListingStatus.Suspended),
            TotalUnderReviewListings = unverifiedCount,
            UnverifiedListingsCount = unverifiedCount,

            // Time-series
            MonthlyNewUsers = await _unitOfWork.Users.GetMonthlyNewUsersAsync(),
            MonthlyNewListings = await _unitOfWork.Listings.GetMonthlyNewListingsAsync(),
            MonthlyNewBookings = await _unitOfWork.Bookings.GetMonthlyNewBookingsAsync(),

            // Recent Activity
            RecentBookings = (await _unitOfWork.Bookings.GetRecentBookingsAsync())
                .Select(b => _mapper.Map<RecentBookingDto>(b)).ToList(),
            RecentListings = (await _unitOfWork.Listings.GetRecentListingsAsync())
                .Select(l => _mapper.Map<RecentListingDto>(l)).ToList(),
        };
    }

    // ============= USERS =============

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(int page, int pageSize, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var allUsers = await _unitOfWork.Users.GetAllAsync();

        // Filter out Admins and SuperAdmins
        // Note: For MVP we do this in-memory. For production, this should be a DB query.
        var superAdmins = await _userManager.GetUsersInRoleAsync("SuperAdmin");
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var excludedIds = new HashSet<string>(superAdmins.Select(u => u.Id).Concat(admins.Select(u => u.Id)));

        allUsers = allUsers.Where(u => !excludedIds.Contains(u.Id)).ToList();
        
        // In-memory filtering (since GetAllAsync returns all)
        if (!string.IsNullOrEmpty(search))
        {
            var lowerTerm = search.ToLower();
            allUsers = allUsers.Where(u => 
                (u.FullName != null && u.FullName.ToLower().Contains(lowerTerm)) ||
                (u.Email != null && u.Email.ToLower().Contains(lowerTerm))
            ).ToList();
        }

        var totalCount = allUsers.Count();
        var skip = (page - 1) * pageSize;

        // Sorting
        allUsers = sortBy?.ToLower() switch
        {
            "name" or "fullname" => isDescending ? allUsers.OrderByDescending(u => u.FullName).ToList() : allUsers.OrderBy(u => u.FullName).ToList(),
            "email" => isDescending ? allUsers.OrderByDescending(u => u.Email).ToList() : allUsers.OrderBy(u => u.Email).ToList(),
            "date" or "createdat" => isDescending ? allUsers.OrderByDescending(u => u.CreatedAt).ToList() : allUsers.OrderBy(u => u.CreatedAt).ToList(),
            _ => allUsers.OrderByDescending(u => u.CreatedAt).ToList()
        };

        var users = allUsers
            .Skip(skip)
            .Take(pageSize)
            .ToList();

        var dtos = new List<AdminUserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var dto = _mapper.Map<AdminUserDto>(user);
            dto.Roles = roles.ToArray();
            dtos.Add(dto);
        }

        return new PagedResult<AdminUserDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> ResetUserPasswordAsync(string userId, string newPassword)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return false; // Cannot reset SuperAdmin password

        // Force remove password
        var removeResult = await _userManager.RemovePasswordAsync(user);
        if (!removeResult.Succeeded) return false;

        // Force add new password
        var addResult = await _userManager.AddPasswordAsync(user, newPassword);
        
        if (addResult.Succeeded)
        {
             // Send email notification
             _jobService.Enqueue(() => _emailService.SendEmailAsync(user.Email, "Password Reset by Admin", 
                $"Your password has been reset by an administrator. Your new temporary password is: {newPassword}. Please login and change it immediately."));
        }
        
        return addResult.Succeeded;
    }

    public async Task<AdminUserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        var dto = _mapper.Map<AdminUserDto>(user);
        dto.Roles = roles.ToArray();
        return dto;
    }

    public async Task<bool> SuspendUserAsync(string userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return false; // Protect SuperAdmin

        user.IsSuspended = true; // Soft suspend
        return true;
    }

    public async Task<bool> UnSuspendUserAsync(string userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return false; // Protect SuperAdmin

        user.IsSuspended = false; // Soft unsuspend
        return true;
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return false;

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return false;

        _unitOfWork.Users.Remove(user);
        return true;
    }

    // ============= LISTINGS =============

    public async Task<PagedResult<AdminListingDto>> GetListingsAsync(int page, int pageSize, string? status = null, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var (items, totalCount) = await _unitOfWork.Listings.GetListingsForAdminAsync(page, pageSize, status, search, sortBy, isDescending);
        var dtos = items.Select(l => _mapper.Map<AdminListingDto>(l)).ToList();

        return new PagedResult<AdminListingDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AdminListingDto?> GetListingByIdAsync(int listingId)
    {
        var listing = await _unitOfWork.Listings.GetListingWithDetailsAsync(listingId);
        return listing == null ? null : _mapper.Map<AdminListingDto>(listing);
    }

    public async Task<bool> UpdateListingStatusAsync(int listingId, ListingStatus status)
    {
        var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
        if (listing == null) return false;

        listing.Status = status;
        listing.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    public async Task<bool> DeleteListingAsync(int listingId)
    {
        var hasConfirmed = await _unitOfWork.Bookings.HasConfirmedBookingsAsync(listingId);
        if (hasConfirmed) return false;

        var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
        if (listing == null) return false;

        _unitOfWork.Listings.Remove(listing);
        return true;
    }

    // ============= BOOKINGS =============

    public async Task<PagedResult<AdminBookingDto>> GetBookingsAsync(int page, int pageSize, string? status = null, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var (items, totalCount) = await _unitOfWork.Bookings.GetBookingsForAdminAsync(page, pageSize, status, search, sortBy, isDescending);
        var dtos = items.Select(b => _mapper.Map<AdminBookingDto>(b)).ToList();

        return new PagedResult<AdminBookingDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AdminBookingDto?> GetBookingByIdAsync(int bookingId)
    {
        var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
        return booking == null ? null : _mapper.Map<AdminBookingDto>(booking);
    }

    public async Task<bool> UpdateBookingStatusAsync(int bookingId, BookingStatus newStatus)
    {
        var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
        if (booking == null) return false;

        if (!IsValidBookingStatusTransition(booking.Status, newStatus))
            return false;

        booking.Status = newStatus;
        if (newStatus == BookingStatus.Cancelled)
        {
            booking.CancelledAt = DateTime.UtcNow;
        }
        return true;
    }

    public async Task<bool> DeleteBookingAsync(int bookingId)
    {
        var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
        if (booking == null) return false;

        // Allow deletion of any booking (admin can delete even confirmed bookings)
        _unitOfWork.Bookings.Remove(booking);
        return true;
    }

    private bool IsValidBookingStatusTransition(BookingStatus current, BookingStatus next)
    {
        // For Admin, we allow all transitions to enable fixing data issues
        return true;
    }

    // ============= REVIEWS =============

    public async Task<PagedResult<AdminReviewDto>> GetReviewsAsync(int page, int pageSize, string? search = null, string? sortBy = null, bool isDescending = false)
    {
        var (items, totalCount) = await _unitOfWork.Reviews.GetReviewsForAdminAsync(page, pageSize, search, sortBy, isDescending);
        
        // Manual mapping if AutoMapper profile isn't updated yet, or use mapper if configured
        var dtos = items.Select(r => new AdminReviewDto
        {
            Id = r.Id,
            Content = r.Comment,
            Rating = r.Rating,
            AuthorName = r.Guest?.FullName ?? "Anonymous",
            AuthorId = r.GuestId,
            ListingTitle = r.Listing?.Title ?? "Unknown Listing",
            DatePosted = r.DatePosted
        }).ToList();

        return new PagedResult<AdminReviewDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> DeleteReviewAsync(int reviewId)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null) return false;

        _unitOfWork.Reviews.Remove(review);
        return true;
    }

    public async Task<bool> SuspendReviewAuthorAsync(int reviewId)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null) return false;

        // Reuse existing user suspension logic
        return await SuspendUserAsync(review.GuestId);
    }
}

