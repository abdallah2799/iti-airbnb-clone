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
using Infrastructure.Repositories;
using AirbnbClone.Infrastructure.Services.Interfaces;

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

    private readonly IBackgroundJobService _jobService;
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        IEmailService emailService, RoleManager<IdentityRole> roleManager,
        IBackgroundJobService jobService,
        IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _emailService = emailService;
        _roleManager = roleManager;
        _jobService = jobService;
        _unitOfWork = unitOfWork;
    }


    /// <summary>
    /// Story: [M] Register with Email
    /// Creates a new user account with email and password
    /// </summary>
    public async Task<AuthResultDto> RegisterWithEmailAsync(string email, string password, string fullName)
    {
        // 1. Check if user already exists (Read-only, no transaction needed yet)
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

        // 2. Start the Transaction
        await _unitOfWork.BeginTransactionAsync();

        try
        {
            // 3. Create new user
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                // Logic failed, rollback any partial DB writes
                await _unitOfWork.RollbackTransactionAsync();
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Failed to create user",
                    Errors = result.Errors.Select(e => e.Description).ToList()
                };
            }

            // 4. Assign Role
            var roleResult = await _userManager.AddToRoleAsync(user, "Guest");
            if (!roleResult.Succeeded)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Failed to assign role",
                    Errors = roleResult.Errors.Select(e => e.Description).ToList()
                };
            }

            // 5. Generate Tokens (Crucial Step)
            // If this crashes (like your NullReferenceException), we jump to 'catch'.
            // The Email line below is NEVER reached.
            var authResult = await GenerateAuthResultAsync(user);

            // 6. Send Welcome Email (Background Job)
            // We only queue this if everything above succeeded.
            _jobService.Enqueue(() => _emailService.SendWelcomeEmailAsync(email, fullName));

            // 7. Commit Transaction
            // This saves the User and Role changes permanently.
            await _unitOfWork.CommitTransactionAsync();

            return authResult;
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw; // Rethrow to let the Controller return 500
        }
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

            // Logic to link accounts or create new one
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
                // Link existing user with Google account (The "Upsert" logic)
                user.GoogleId = googleId;
                user.FullName ??= name; // Update name if not set
                await _userManager.UpdateAsync(user);
            }

            // --- THE UPDATE ---
            // Instead of manually creating just the Access Token, 
            // we use the helper to create BOTH Access + Refresh Tokens and save them to DB.
            return await GenerateAuthResultAsync(user);
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
        // 1. Find User
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // Security Tip: Generic message (handled in Controller too, but good to be safe here)
            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid email or password",
                Errors = new List<string> { "User not found" }
            };
        }

        // 2. Check Password
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

        // 3. Update Last Login (Great feature, keep this!)
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // 4. Generate Tokens & Return
        // --- THE UPDATE ---
        // Instead of manually building the DTO, we use the helper to 
        // generate Access Token + Refresh Token and save them to DB.
        return await GenerateAuthResultAsync(user);
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
        // var emailSent = await _emailService.SendPasswordResetEmailAsync(email, resetLink);
        ;
        _jobService.Enqueue(() => _emailService.SendPasswordResetEmailAsync(email, resetLink));

        return true;
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

        // Update the HostSince property
        user.HostSince = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // --- THE FIX ---
        // Use the helper to generate a NEW Access Token AND a NEW Refresh Token.
        // This ensures the new Refresh Token is linked to this specific Access Token ID (JTI).
        return await GenerateAuthResultAsync(user);
    }
    // --- END: NEW METHOD ---



    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
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

    public async Task<AuthResultDto> RefreshTokenAsync(string token, string refreshToken)
    {
        // 1. Get Claims from Expired Token (Same as before)
        var validatedToken = GetPrincipalFromToken(token);
        if (validatedToken == null) return new AuthResultDto { Success = false, Message = "Invalid Token" };

        var expiryDateUnix = long.Parse(validatedToken.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Exp).Value);
        var expiryDateTimeUtc = DateTimeOffset.FromUnixTimeSeconds(expiryDateUnix).UtcDateTime;

        if (expiryDateTimeUtc > DateTime.UtcNow)
        {
            return new AuthResultDto { Success = false, Message = "Token hasn't expired yet" };
        }

        var jti = validatedToken.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Jti).Value;

        // 2. USE REPOSITORY HERE
        var storedRefreshToken = await _unitOfWork.RefreshTokens.GetByTokenAsync(refreshToken);

        // --- Validation Checks (Same as before) ---
        if (storedRefreshToken == null) return new AuthResultDto { Success = false, Message = "Refresh Token does not exist" };
        if (DateTime.UtcNow > storedRefreshToken.ExpiryDate) return new AuthResultDto { Success = false, Message = "Token expired" };
        if (storedRefreshToken.IsRevoked) return new AuthResultDto { Success = false, Message = "Token revoked" };

        // --- REUSE DETECTION ---
        if (storedRefreshToken.IsUsed)
        {
            storedRefreshToken.IsRevoked = true;
            _unitOfWork.RefreshTokens.Update(storedRefreshToken); // Repository Update
            await _unitOfWork.CompleteAsync(); // Save
            return new AuthResultDto { Success = false, Message = "Security Alert: Token Reuse. Login required." };
        }

        if (storedRefreshToken.JwtId != jti) return new AuthResultDto { Success = false, Message = "Token mismatch" };

        // 3. UPDATE OLD TOKEN
        storedRefreshToken.IsUsed = true;
        _unitOfWork.RefreshTokens.Update(storedRefreshToken);
        await _unitOfWork.CompleteAsync();

        // 4. GENERATE NEW TOKENS
        var dbUser = await _userManager.FindByIdAsync(storedRefreshToken.UserId);
        var newJwtToken = await GenerateJwtToken(dbUser);

        // Get new JTI
        var newPrincipal = GetPrincipalFromToken(newJwtToken);
        var newJti = newPrincipal.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Jti).Value;

        var newRefreshToken = new RefreshToken
        {
            JwtId = newJti,
            IsUsed = false,
            UserId = dbUser.Id,
            AddedDate = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddMonths(6),
            IsRevoked = false,
            Token = GenerateRandomString(35) + Guid.NewGuid()
        };

        // 5. SAVE NEW TOKEN
        await _unitOfWork.RefreshTokens.AddAsync(newRefreshToken); // Repository Add
        await _unitOfWork.CompleteAsync(); // Save

        return new AuthResultDto
        {
            Success = true,
            Token = newJwtToken,
            RefreshToken = newRefreshToken.Token
        };
    }

    private ClaimsPrincipal GetPrincipalFromToken(string token)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = false,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            // Check 2: Algorithm Security Check
            // Ensure the token used HmacSha256 (prevents "None" algo attacks)
            if (!(securityToken is JwtSecurityToken jwtSecurityToken) ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid Token Algorithm");
            }

            return principal;
        }
        catch
        {
            return null; // Return null if signature is fake or token is malformed
        }
    }

    private string GenerateRandomString(int length)
    {
        var random = new byte[length];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(random);
        }
        return Convert.ToBase64String(random);
    }

    private async Task<AuthResultDto> GenerateAuthResultAsync(ApplicationUser user)
    {
        // 1. Generate the Access Token (Key Card)
        var jwtToken = await GenerateJwtToken(user);

        // 2. Get the JTI (Unique ID) from that token so we can link them
        var principal = GetPrincipalFromToken(jwtToken);
        var jti = principal.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Jti).Value;

        // 3. Create the Refresh Token (Passport)
        var refreshToken = new RefreshToken
        {
            JwtId = jti,
            IsUsed = false,
            UserId = user.Id,
            AddedDate = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddMonths(6), // Long life
            IsRevoked = false,
            Token = GenerateRandomString(35) + Guid.NewGuid()
        };

        // 4. Save to Database
        await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
        await _unitOfWork.CompleteAsync();

        // 5. Return the Package
        return new AuthResultDto
        {
            Success = true,
            Token = jwtToken,
            RefreshToken = refreshToken.Token, // Send this to the user!
            Message = "Authentication successful",
            // Populate user details if needed for the frontend
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName
            }
        };
    }
}