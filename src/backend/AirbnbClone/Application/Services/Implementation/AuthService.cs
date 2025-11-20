using System.IdentityModel.Tokens.Jwt;
using Google.Apis.Auth;
using System.Security.Claims;
using System.Text;
using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Application.Services.Implementation;

/// <summary>
/// Authentication service implementation (Sprint 0)
/// Handles user registration, login, password management, and JWT token generation
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        IEmailService emailService, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _emailService = emailService;
        _roleManager = roleManager;
    }


    /// <summary>
    /// Story: [M] Register with Email
    /// Creates a new user account with email and password
    /// </summary>
    public async Task<AuthResultDto> RegisterWithEmailAsync(string email, string password, string fullName)
    {
        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return new AuthResultDto 
            { 
                Success = false, 
                Message = "User with this email already exists",
                Errors = new List<string> { "Email already registered" }
            };
        }

        // Create new user
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true, // For MVP, we skip email confirmation
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        
        if (!result.Succeeded)
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Failed to create user",
                Errors = result.Errors.Select(e => e.Description).ToList()
            };
        }

        // Assign the default "Guest" role
        await _userManager.AddToRoleAsync(user, "Guest");

        _ = _emailService.SendWelcomeEmailAsync(email, fullName);

        // Send welcome email (async, don't wait)
        _ = _emailService.SendWelcomeEmailAsync(email, fullName);

        // Generate JWT token and return result
        // --- CHANGE THIS ---
        // Must be awaited now
        var token = await GenerateJwtToken(user);
        return new AuthResultDto
        {
            Success = true,
            Token = token,
            Message = "Registration successful",
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            }
        };
    }

    /// <summary>
    /// Story: [M] Register with Google
    /// Creates or finds user account using Google OAuth
    /// </summary>
    public async Task<AuthResultDto> RegisterWithGoogleAsync(string googleToken)
    {
        // Sprint 0: Implement Google OAuth token verification and registration
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings();
            var clientId = _configuration["Google:ClientId"];
            if (!string.IsNullOrEmpty(clientId))
            {
                settings.Audience = new List<string> { clientId };
            }
            var payload = await GoogleJsonWebSignature.ValidateAsync(googleToken, settings);
            var email = payload.Email;
            var name = payload.Name;
            var googleId = payload.Subject;

            var user = await _userManager.FindByEmailAsync(email);
            var isNewUser = user == null;
            
            if (user == null)
            {
                user = new ApplicationUser
                {
                    Email = email,
                    UserName = email,
                    FullName = name,
                    GoogleId = googleId,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };
                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                {
                    return new AuthResultDto
                    {
                        Success = false,
                        Message = "Failed to create user with Google",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                    
                }
                // Assign the default "Guest" role
                await _userManager.AddToRoleAsync(user, "Guest");
            }
            else if (string.IsNullOrEmpty(user.GoogleId))
            {
                // Link existing user with Google account
                user.GoogleId = googleId;
                user.FullName ??= name; // Update name if not set
                await _userManager.UpdateAsync(user);
            }

            // Generate JWT token
            // --- CHANGE THIS ---
            var token = await GenerateJwtToken(user);
            return new AuthResultDto
            {
                Success = true,
                Token = token,
                Message = isNewUser ? "Registration successful" : "Login successful",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FullName = user.FullName ?? string.Empty,
                    PhoneNumber = user.PhoneNumber,
                    CreatedAt = user.CreatedAt
                }
            };
        }
        catch (Exception ex)
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Google authentication failed",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    /// <summary>
    /// Story: [M] Login with Email
    /// Authenticates user with email and password
    /// </summary>
    public async Task<AuthResultDto> LoginWithEmailAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid email or password",
                Errors = new List<string> { "User not found" }
            };
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: false);
        
        if (!result.Succeeded)
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid email or password",
                Errors = new List<string> { "Invalid credentials" }
            };
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Generate JWT token
        // --- CHANGE THIS ---
        var token = await GenerateJwtToken(user);
        return new AuthResultDto
        {
            Success = true,
            Token = token,
            Message = "Login successful",
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            }
        };
    }

    /// <summary>
    /// Story: [M] Login with Google
    /// Authenticates user using Google OAuth
    /// </summary>
    public async Task<AuthResultDto> LoginWithGoogleAsync(string googleToken)
    {
        // Sprint 0: Reuse RegisterWithGoogle logic (it handles both registration and login)
        return await RegisterWithGoogleAsync(googleToken);
    }

    /// <summary>
    /// Story: [M] Forgot Password Request
    /// Generates password reset token and sends email
    /// </summary>
    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // For security, don't reveal if user exists
            return true;
        }

        // Generate password reset token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Build reset link
        var frontendUrl = _configuration["ApplicationUrls:FrontendUrl"] ?? "http://localhost:4200";
        var resetLink = $"{frontendUrl}/auth/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

        // Send password reset email
        var emailSent = await _emailService.SendPasswordResetEmailAsync(email, resetLink);

        return emailSent;
    }

    /// <summary>
    /// Story: [M] Reset Password (Using Link)
    /// Resets user password using token from email
    /// </summary>
    public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return false;
        }

        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        
        return result.Succeeded;
    }

    /// <summary>
    /// Story: [M] Update Password (Logged-In)
    /// Changes password for authenticated user
    /// </summary>
    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        
        return result.Succeeded;
    }


    // --- START: NEW METHOD TO BECOME HOST ---
    public async Task<AuthResultDto> BecomeHostAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new AuthResultDto { Success = false, Message = "User not found." };
        }
        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin)
        {
            return new AuthResultDto { Success = false, Message = "Admins cannot become Hosts." };
        }

        var isHost = await _userManager.IsInRoleAsync(user, "Host");
        if (isHost)
        {
            return new AuthResultDto { Success = false, Message = "User is already a Host." };
        }

        // Add the "Host" role. The user is now BOTH "Guest" and "Host"
        var result = await _userManager.AddToRoleAsync(user, "Host");
        if (!result.Succeeded)
        {
            return new AuthResultDto { Success = false, Message = "Failed to add role.", Errors = result.Errors.Select(e => e.Description).ToList() };
        }

        // Update the HostSince property from ApplicationUser.cs
        user.HostSince = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Return a new token that includes the new "Host" role
        var token = await GenerateJwtToken(user);
        return new AuthResultDto
        {
            Success = true,
            Token = token,
            Message = "User successfully upgraded to Host.",
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            }
        };
    }
    // --- END: NEW METHOD ---



    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
    // --- START: MODIFIED TOKEN GENERATION ---
    public async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        // Get JWT settings from configuration
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Key not configured");
        var jwtIssuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer not configured");
        var jwtAudience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience not configured");
        var jwtExpiryMinutes = int.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "1440");

        // --- CREATE SIGNING CREDENTIALS ---
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // --- GET ROLES ---
        if (user == null)
            throw new ArgumentNullException(nameof(user));

        var roles = await _userManager.GetRolesAsync(user);

        // --- BUILD CLAIMS LIST ---
        var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? string.Empty)
            };

        // --- ADD ROLES TO CLAIMS ---
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: jwtIssuer, // Payload
            audience: jwtAudience, // Payload
            claims: claims, // Payload
            expires: DateTime.UtcNow.AddMinutes(jwtExpiryMinutes), // Payload
            signingCredentials: credentials // Headers
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    // --- END: MODIFIED TOKEN GENERATION ---


    

    /// <summary>
    /// Validate JWT token
    /// </summary>
    public async Task<string?> ValidateTokenAsync(string token)
{
    if (string.IsNullOrEmpty(token))
        return null;

    var key = _configuration["Jwt:Key"];
    var issuer = _configuration["Jwt:Issuer"];
    var audience = _configuration["Jwt:Audience"];

    if (string.IsNullOrEmpty(key))
        throw new InvalidOperationException("Jwt:Key is not configured.");
    if (string.IsNullOrEmpty(issuer))
        throw new InvalidOperationException("Jwt:Issuer is not configured.");
    if (string.IsNullOrEmpty(audience))
        throw new InvalidOperationException("Jwt:Audience is not configured.");

    var tokenHandler = new JwtSecurityTokenHandler();
    var validationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    try
    {
        var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

        // Check if token is expired
        if (validatedToken is JwtSecurityToken jwtToken)
        {
            if (jwtToken.ValidTo < DateTime.UtcNow)
                return null;
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId;
    }
    catch
    {
        return null;
    }
}
}
