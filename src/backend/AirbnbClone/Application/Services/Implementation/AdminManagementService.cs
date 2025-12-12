using Application.DTOs;
using Application.DTOs.Admin;
using Application.Services.Interfaces;
using AutoMapper;
using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services.Implementation;

/// <summary>
/// Implementation of admin user management service
/// </summary>
/// <remarks>
/// Handles CRUD operations for admin users (Admin role only).
/// SuperAdmin users are excluded from listings and protected from deletion.
/// 
/// **Security Notes**:
/// - Authorization enforced at controller level
/// - Email uniqueness validated via UserManager
/// - SuperAdmin users cannot be deleted
/// </remarks>
public class AdminManagementService : IAdminManagementService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly ILogger<AdminManagementService> _logger;

    public AdminManagementService(
        UserManager<ApplicationUser> userManager,
        IMapper mapper,
        ILogger<AdminManagementService> logger)
    {
        _userManager = userManager;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<AdminUserDto>> GetAdminsAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        string? sortBy = null, 
        bool isDescending = false)
    {
        // Get all users with "Admin" role (exclude SuperAdmin)
        var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            adminUsers = adminUsers
                .Where(u => u.Email.ToLower().Contains(search) || 
                           u.FullName.ToLower().Contains(search))
                .ToList();
        }

        // Apply sorting
        var query = adminUsers.AsQueryable();
        query = sortBy?.ToLower() switch
        {
            "email" => isDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "fullname" => isDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "createdat" => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => query.OrderBy(u => u.CreatedAt)
        };

        var totalCount = query.Count();
        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        // Map to DTOs
        var dtos = new List<AdminUserDto>();
        foreach (var user in items)
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

    public async Task<AdminUserDto?> CreateAdminAsync(CreateAdminDto dto)
    {
        // Check if user with email already exists
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            _logger.LogWarning("Attempted to create admin with existing email: {Email}", dto.Email);
            return null;
        }

        // Create new admin user
        var adminUser = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            EmailConfirmed = true, // Auto-confirm admin emails
            FullName = dto.FullName,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(adminUser, dto.Password);
        if (!createResult.Succeeded)
        {
            _logger.LogError("Failed to create admin user with email: {Email}", dto.Email);
            foreach (var error in createResult.Errors)
            {
                _logger.LogError("User creation error: {Error}", error.Description);
            }
            return null;
        }

        // Assign Admin role
        var roleResult = await _userManager.AddToRoleAsync(adminUser, "Admin");
        if (!roleResult.Succeeded)
        {
            _logger.LogError("Failed to assign Admin role to user {Email}", dto.Email);
            // Rollback user creation
            await _userManager.DeleteAsync(adminUser);
            return null;
        }

        _logger.LogInformation("Admin user created successfully: {Email}", dto.Email);

        // Map to DTO
        var roles = await _userManager.GetRolesAsync(adminUser);
        var resultDto = _mapper.Map<AdminUserDto>(adminUser);
        resultDto.Roles = roles.ToArray();

        return resultDto;
    }


    public async Task<bool> DeleteAdminAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Check if user is SuperAdmin (protection rule)
        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin"))
        {
            _logger.LogWarning("Attempted to delete SuperAdmin user: {UserId}", userId);
            return false;
        }

        // Hard delete the admin user (remove from system)
        var result = await _userManager.DeleteAsync(user);

        if (result.Succeeded)
        {
            _logger.LogInformation("Admin user deleted: {UserId}", userId);
            return true;
        }

        _logger.LogError("Failed to delete admin user: {UserId}", userId);
        return false;
    }
}
