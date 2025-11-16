using Core.Entities;

namespace Infrastructure.Repositories;

/// <summary>
/// Repository interface for User operations (Sprint 0)
/// </summary>
public interface IUserRepository : IRepository<ApplicationUser>
{
    /// <summary>
    /// Story: [M] Register with Email - Get user by email for registration validation
    /// </summary>
    Task<ApplicationUser?> GetByEmailAsync(string email);

    /// <summary>
    /// Story: [M] Register with Google - Find user by external login provider
    /// </summary>
    Task<ApplicationUser?> GetByExternalLoginAsync(string provider, string providerKey);

    /// <summary>
    /// Story: [S] Edit User Profile - Update user profile with bio and picture
    /// </summary>
    Task<bool> UpdateProfileAsync(string userId, string? bio, string? profilePictureUrl);

    /// <summary>
    /// Get user with their listings (for host operations)
    /// </summary>
    Task<ApplicationUser?> GetWithListingsAsync(string userId);

    /// <summary>
    /// Get user with their bookings (for guest operations)
    /// </summary>
    Task<ApplicationUser?> GetWithBookingsAsync(string userId);
}
