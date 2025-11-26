using Application.DTOs;
using Core.Entities;

namespace Application.Services.Interfaces;

/// <summary>
/// Authentication service interface (Sprint 0)
/// Handles user registration, login, password management, and JWT token generation
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Story: [M] Register with Email
    /// Creates a new user account with email and password
    /// </summary>
    /// <param name="email">User email</param>
    /// <param name="password">User password</param>
    /// <param name="fullName">User full name</param>
    /// <returns>AuthResultDto with token and user information</returns>
    Task<AuthResultDto> RegisterWithEmailAsync(string email, string password, string fullName);

    /// <summary>
    /// Story: [M] Register with Google
    /// Creates or finds user account using Google OAuth
    /// </summary>
    /// <param name="googleToken">Google OAuth token</param>
    /// <returns>AuthResultDto with token and user information</returns>
    Task<AuthResultDto> RegisterWithGoogleAsync(string googleToken);

    /// <summary>
    /// Story: [M] Login with Email
    /// Authenticates user with email and password
    /// </summary>
    /// <param name="email">User email</param>
    /// <param name="password">User password</param>
    /// <returns>AuthResultDto with token and user information</returns>
    Task<AuthResultDto> LoginWithEmailAsync(string email, string password);

    /// <summary>
    /// Story: [M] Forgot Password Request
    /// Generates password reset token and sends email
    /// </summary>
    /// <param name="email">User email</param>
    /// <returns>True if email sent successfully</returns>
    Task<bool> ForgotPasswordAsync(string email);

    /// <summary>
    /// Story: [M] Reset Password (Using Link)
    /// Resets user password using token from email
    /// </summary>
    /// <param name="email">User email</param>
    /// <param name="token">Reset token from email</param>
    /// <param name="newPassword">New password</param>
    /// <returns>True if password reset successful</returns>
    Task<bool> ResetPasswordAsync(string email, string token, string newPassword);

    /// <summary>
    /// Story: [M] Update Password (Logged-In)
    /// Changes password for authenticated user
    /// </summary>
    /// <param name="userId">Current user ID</param>
    /// <param name="currentPassword">Current password</param>
    /// <param name="newPassword">New password</param>
    /// <returns>True if password changed successfully</returns>
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);

    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
    /// <param name="user">Application user</param>
    /// <returns>JWT token string</returns>
    // string GenerateJwtToken(ApplicationUser user);
    Task<string> GenerateJwtToken(ApplicationUser user);


    Task<AuthResultDto> BecomeHostAsync(string userId);


    /// <summary>
    /// Validate JWT token
    /// </summary>
    /// <param name="token">JWT token to validate</param>
    /// <returns>User ID if valid, null otherwise</returns>
    Task<string?> ValidateTokenAsync(string token);

    Task<AuthResultDto> RefreshTokenAsync(string token, string refreshToken);
}
