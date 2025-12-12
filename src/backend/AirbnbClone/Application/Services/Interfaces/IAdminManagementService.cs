using Application.DTOs;
using Application.DTOs.Admin;
using System.Threading.Tasks;

namespace Application.Services.Interfaces;

/// <summary>
/// Service for managing admin users (SuperAdmin-only operations)
/// </summary>
/// <remarks>
/// This service handles CRUD operations specifically for managing users with the "Admin" role.
/// All operations are restricted to SuperAdmin users only (enforced at controller level).
/// 
/// **Key Features**:
/// - Get paginated list of admin users
/// - Create new admin users
/// - Soft delete admin users
/// 
/// **Protection Rules**:
/// - SuperAdmin users cannot be deleted via this service
/// - Email uniqueness is enforced
/// - Admins are filtered to show only "Admin" role users (excludes SuperAdmin)
/// </remarks>
public interface IAdminManagementService
{
    /// <summary>
    /// Retrieves a paginated list of admin users
    /// </summary>
    /// <param name="page">Page number (1-indexed)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="search">Optional search term (searches email and full name)</param>
    /// <param name="sortBy">Optional column to sort by (email, fullName, createdAt)</param>
    /// <param name="isDescending">Sort direction</param>
    /// <returns>Paginated list of admin users with "Admin" role only</returns>
    Task<PagedResult<AdminUserDto>> GetAdminsAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        string? sortBy = null, 
        bool isDescending = false);

    /// <summary>
    /// Creates a new admin user with "Admin" role
    /// </summary>
    /// <param name="dto">Admin creation data</param>
    /// <returns>Created admin user details, or null if email already exists</returns>
    Task<AdminUserDto?> CreateAdminAsync(CreateAdminDto dto);

    /// <summary>
    /// Soft deletes an admin user
    /// </summary>
    /// <param name="userId">ID of the admin to delete</param>
    /// <returns>True if deleted successfully, false if user not found or is SuperAdmin</returns>
    Task<bool> DeleteAdminAsync(string userId);
}
