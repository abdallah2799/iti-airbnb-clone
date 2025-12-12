using Application.DTOs;
using Application.DTOs.Admin;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Api.Controllers;

/// <summary>
/// Manages admin user accounts (SuperAdmin-only access)
/// </summary>
/// <remarks>
/// This controller provides endpoints for managing users with the "Admin" role.
/// All operations are restricted to SuperAdmin users only.
/// 
/// **Security**:
/// - All endpoints require JWT authentication with "SuperAdmin" role
/// - Authorization enforced via [Authorize(Roles = "SuperAdmin")]
/// - Regular Admin users cannot access these endpoints
/// 
/// **Key Operations**:
/// - List all admin users (excludes SuperAdmin)
/// - Create new admin users
/// - Delete admin users (soft delete via suspension)
/// 
/// **Protection Rules**:
/// - SuperAdmin users cannot be deleted via this controller
/// - Email uniqueness is enforced
/// </remarks>
[ApiController]
[Route("api/admin-management")]
[Authorize(Roles = "SuperAdmin")]
[Produces("application/json")]
public class AdminManagementController : ControllerBase
{
    private readonly IAdminManagementService _adminManagementService;
    private readonly ILogger<AdminManagementController> _logger;

    public AdminManagementController(
        IAdminManagementService adminManagementService,
        ILogger<AdminManagementController> logger)
    {
        _adminManagementService = adminManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a paginated list of admin users
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10, max: 100)</param>
    /// <param name="search">Optional search term (searches email and full name)</param>
    /// <param name="sortBy">Optional column to sort by (email, fullName, createdAt)</param>
    /// <param name="isDescending">Sort direction (default: false)</param>
    /// <returns>Paginated list of admin users</returns>
    /// <response code="200">Returns paginated admin list</response>
    /// <response code="401">Unauthorized (missing or invalid JWT)</response>
    /// <response code="403">Forbidden (user is not SuperAdmin)</response>
    [HttpGet("admins")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetAdmins(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool isDescending = false)
    {
        pageSize = Math.Min(pageSize, 100); // Prevent abuse
        var result = await _adminManagementService.GetAdminsAsync(page, pageSize, search, sortBy, isDescending);
        return Ok(result);
    }

    /// <summary>
    /// Creates a new admin user
    /// </summary>
    /// <param name="dto">Admin creation data</param>
    /// <returns>Created admin user details</returns>
    /// <response code="201">Admin created successfully</response>
    /// <response code="400">Bad request (validation errors or email already exists)</response>
    /// <response code="401">Unauthorized (missing or invalid JWT)</response>
    /// <response code="403">Forbidden (user is not SuperAdmin)</response>
    [HttpPost("admins")]
    public async Task<ActionResult<AdminUserDto>> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _adminManagementService.CreateAdminAsync(dto);
        if (result == null)
        {
            return BadRequest(new { message = "Email already exists or failed to create admin user" });
        }

        _logger.LogInformation("New admin user created: {Email} by SuperAdmin", dto.Email);
        return CreatedAtAction(nameof(GetAdmins), new { page = 1, pageSize = 10 }, result);
    }

    /// <summary>
    /// Soft deletes an admin user
    /// </summary>
    /// <param name="id">Admin user ID</param>
    /// <returns>Success status</returns>
    /// <response code="204">Admin deleted successfully</response>
    /// <response code="400">Bad request (cannot delete SuperAdmin)</response>
    /// <response code="404">Admin not found</response>
    /// <response code="401">Unauthorized (missing or invalid JWT)</response>
    /// <response code="403">Forbidden (user is not SuperAdmin)</response>
    [HttpDelete("admins/{id}")]
    public async Task<ActionResult> DeleteAdmin(string id)
    {
        var success = await _adminManagementService.DeleteAdminAsync(id);
        if (!success)
        {
            return NotFound(new { message = "Admin user not found or cannot be deleted (e.g., SuperAdmin)" });
        }

        _logger.LogInformation("Admin user {UserId} deleted by SuperAdmin", id);
        return NoContent();
    }
}
