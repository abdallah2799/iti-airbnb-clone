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

    public AdminService(
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _mapper = mapper;
    }

    // ============= USERS =============

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        var totalCount = await _unitOfWork.Users.CountAsync();

        var allUsers = await _unitOfWork.Users.GetAllAsync();
        var users = allUsers
            .OrderBy(u => u.CreatedAt)
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

        user.EmailConfirmed = false; // Soft suspend
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

    public async Task<PagedResult<AdminListingDto>> GetListingsAsync(int page, int pageSize)
    {
        var (items, totalCount) = await _unitOfWork.Listings.GetListingsForAdminAsync(page, pageSize);
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

    public async Task<PagedResult<AdminBookingDto>> GetBookingsAsync(int page, int pageSize)
    {
        var (items, totalCount) = await _unitOfWork.Bookings.GetBookingsForAdminAsync(page, pageSize);
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

        if (booking.Status == BookingStatus.Confirmed)
            return false; // Only allow deletion of non-confirmed bookings

        _unitOfWork.Bookings.Remove(booking);
        return true;
    }

    private bool IsValidBookingStatusTransition(BookingStatus current, BookingStatus next)
    {
        return (current == BookingStatus.Pending && next == BookingStatus.Confirmed) ||
               (current == BookingStatus.Confirmed && next == BookingStatus.Cancelled) ||
               (current == BookingStatus.Pending && next == BookingStatus.Cancelled);
    }
}

