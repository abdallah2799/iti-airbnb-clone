using Application.DTOs;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manages user authentication operations including registration, login, password reset, and OAuth.
/// </summary>
/// <remarks>
/// This controller handles all authentication-related endpoints for the Airbnb Clone API.
/// Supports both traditional email/password authentication and Google OAuth integration.
/// 
/// **Sprint 0 Focus**: Core authentication features
/// - User registration (email and Google)
/// - User login (email and Google)
/// - Password management (forgot, reset, change)
/// - Token validation
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly UserManager<Core.Entities.ApplicationUser> _userManager;
    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger,
        UserManager<Core.Entities.ApplicationUser> userManager)
    {
        _authService = authService;
        _logger = logger;
        _userManager = userManager;
    }

    /// <summary>
    /// Registers a new user account with email and password
    /// </summary>
    /// <remarks>
    /// Creates a new user account using email and password credentials.
    /// 
    /// **Password Requirements:**
    /// - At least 8 characters long
    /// - Contains at least one uppercase letter
    /// - Contains at least one lowercase letter
    /// - Contains at least one digit
    /// 
    /// **User Story**: [M] Register with Email (Sprint 0 - Story 1)
    /// 
    /// **Business Rules:**
    /// - Email must be unique across all users
    /// - Email format must be valid
    /// - User account is created with "Guest" role by default
    /// - Email confirmation may be required (configurable)
    /// 
    /// **Implementation Notes:**
    /// 1. Validate request model (email format, password strength, required fields)
    /// 2. Call AuthService.RegisterWithEmailAsync(email, password, fullName)
    /// 3. Generate JWT token for immediate login
    /// 4. Return user information and authentication token
    /// </remarks>
    /// <param name="request">Registration request containing email, password, firstName, and lastName</param>
    /// <returns>Returns the newly registered user information and JWT authentication token</returns>
    /// <response code="200">User successfully registered. Returns user details and JWT token.</response>
    /// <response code="400">Invalid request data. Check validation errors in response (invalid email format, weak password, missing required fields).</response>
    /// <response code="409">Email address already exists in the system.</response>
    /// <response code="500">Internal server error occurred during registration process.</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        // Sprint 0 - Story 1: Register with Email
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.RegisterWithEmailAsync(request.Email, request.Password, request.FullName);

            if (!result.Success)
            {
                if (result.Errors.Any(e => e.ToLower().Contains("already") || e.ToLower().Contains("exist")))
                {
                    return Conflict(new { message = result.Message, errors = result.Errors });
                }
                return BadRequest(new { message = result.Message, errors = result.Errors });
            }

            _logger.LogInformation("User registered successfully: {Email}", request.Email);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    /// <summary>
    /// Registers or authenticates a user using Google OAuth
    /// </summary>
    /// <remarks>
    /// Creates a new user account or authenticates an existing user using Google OAuth token.
    /// 
    /// **User Story**: [M] Register with Google (Sprint 0 - Story 2)
    /// 
    /// **OAuth Flow:**
    /// 1. Frontend obtains Google ID token using Google Sign-In
    /// 2. Frontend sends token to this endpoint
    /// 3. Backend validates token with Google
    /// 4. Backend creates new user or finds existing user by Google ID
    /// 5. Backend generates JWT token
    /// 
    /// **Business Rules:**
    /// - Google token must be valid and not expired
    /// - Email from Google account is used as user email
    /// - User profile info (name, photo) is populated from Google
    /// - User is created with "Guest" role by default
    /// 
    /// **Implementation Notes:**
    /// 1. Extract Google ID token from request
    /// 2. Validate token with Google API
    /// 3. Call AuthService.RegisterWithGoogleAsync(googleToken)
    /// 4. Service creates/finds user and issues JWT
    /// </remarks>
    /// <param name="request">Google authentication request containing the Google ID token</param>
    /// <returns>Returns user information and JWT authentication token</returns>
    /// <response code="200">User successfully authenticated with Google. Returns user details and JWT token.</response>
    /// <response code="400">Invalid Google token or token validation failed.</response>
    /// <response code="500">Internal server error occurred during Google authentication.</response>
    [HttpPost("register/google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto request)
    {
        // Sprint 0 - Story 2: Register with Google (Optional for MVP)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.RegisterWithGoogleAsync(request.GoogleToken);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message, errors = result.Errors });
            }

            _logger.LogInformation("User authenticated with Google successfully: {Email}", result.User?.Email);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google registration");
            return StatusCode(500, new { message = "An error occurred during Google registration" });
        }
    }

    /// <summary>
    /// Authenticates a user with email and password
    /// </summary>
    /// <remarks>
    /// Validates user credentials and returns a JWT authentication token.
    /// 
    /// **User Story**: [M] Login with Email (Sprint 0 - Story 3)
    /// 
    /// **Authentication Process:**
    /// 1. Validates email and password credentials
    /// 2. Checks if account is locked or disabled
    /// 3. Updates last login timestamp
    /// 4. Generates JWT token with user claims
    /// 
    /// **Business Rules:**
    /// - Email and password must match existing user
    /// - Account must not be locked or disabled
    /// - Failed login attempts may trigger account lockout (configurable)
    /// - JWT token expires after configured duration (default: 24 hours)
    /// 
    /// **Security Features:**
    /// - Password is never returned in response
    /// - Failed attempts are logged for security monitoring
    /// - Tokens include user ID, email, and roles as claims
    /// 
    /// **Implementation Notes:**
    /// 1. Validate request (email and password present)
    /// 2. Call AuthService.LoginWithEmailAsync(email, password)
    /// 3. Update LastLoginAt timestamp
    /// 4. Return JWT token with user information
    /// </remarks>
    /// <param name="request">Login request containing email and password</param>
    /// <returns>Returns user information and JWT authentication token</returns>
    /// <response code="200">User successfully authenticated. Returns user details and JWT token.</response>
    /// <response code="400">Invalid request data. Email or password is missing.</response>
    /// <response code="401">Invalid credentials. Email or password is incorrect.</response>
    /// <response code="403">Account is locked or disabled.</response>
    /// <response code="500">Internal server error occurred during authentication.</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        // Sprint 0 - Story 3: Login with Email
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.LoginWithEmailAsync(request.Email, request.Password);

            if (!result.Success)
            {
                if (result.ErrorCode == "AUTH_SUSPENDED")
                {
                    return StatusCode(403, new { message = result.Message, errors = result.Errors, errorCode = result.ErrorCode });
                }
                
                if (result.ErrorCode == "AUTH_EMAIL_NOT_CONFIRMED")
                {
                    // Using 403 Forbidden effectively communicates "Valid credentials but not allowed yet".
                    // However, we'll stick to a consistent error object so frontend can switch on errorCode.
                    return StatusCode(403, new { message = result.Message, errors = result.Errors, errorCode = result.ErrorCode }); 
                }

                return Unauthorized(new { message = result.Message, errors = result.Errors });
            }

            _logger.LogInformation("User logged in successfully: {Email}", request.Email);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Initiates the password reset process by sending a reset link to user's email
    /// </summary>
    /// <remarks>
    /// Generates a password reset token and sends an email with reset instructions.
    /// 
    /// **User Story**: [M] Forgot Password Request (Sprint 0 - Story 6)
    /// 
    /// **Reset Flow:**
    /// 1. User provides their email address
    /// 2. System generates a secure reset token (expires in 1 hour)
    /// 3. Email sent with reset link: `https://app.com/reset-password?token=[token]&amp;email=[email]`
    /// 4. User clicks link and is redirected to Angular app
    /// 5. User submits new password via /api/auth/reset-password endpoint
    /// 
    /// **Security Measures:**
    /// - Always returns success message (doesn't reveal if email exists)
    /// - Reset token expires after 1 hour
    /// - Token can only be used once
    /// - Token is cryptographically secure
    /// - Rate limiting prevents abuse
    /// 
    /// **Business Rules:**
    /// - Email must be valid format
    /// - Generic success message returned for security (prevents email enumeration)
    /// - If email doesn't exist, no email is sent but success is returned
    /// - Multiple requests generate new tokens (old ones become invalid)
    /// 
    /// **Implementation Notes:**
    /// 1. Extract and validate email from request
    /// 2. Call AuthService.ForgotPasswordAsync(email)
    /// 3. Service generates reset token using UserManager.GeneratePasswordResetTokenAsync()
    /// 4. Service sends email via EmailService.SendPasswordResetEmailAsync()
    /// 5. Always return generic success message
    /// </remarks>
    /// <param name="request">Request containing the user's email address</param>
    /// <returns>Returns a generic success message</returns>
    /// <response code="200">Password reset instructions have been sent if the email exists in the system.</response>
    /// <response code="400">Invalid request data. Email format is invalid or missing.</response>
    /// <response code="429">Too many password reset requests. Please try again later.</response>
    /// <response code="500">Internal server error occurred while processing the password reset request.</response>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
    {
        // Sprint 0 - Story 6: Forgot Password Request
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _authService.ForgotPasswordAsync(request.Email);

            // Always return success for security (don't reveal if email exists)
            _logger.LogInformation("Password reset requested for: {Email}", request.Email);

            return Ok(new
            {
                success = true,
                message = "If an account with this email exists, a password reset link has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password: {Email}", request.Email);
            // Still return success message for security
            return Ok(new
            {
                success = true,
                message = "If an account with this email exists, a password reset link has been sent."
            });
        }
    }

    /// <summary>
    /// Resets user password using a valid reset token from email
    /// </summary>
    /// <remarks>
    /// Completes the password reset process using the token sent via email.
    /// 
    /// **User Story**: [M] Reset Password Using Link (Sprint 0 - Story 7)
    /// 
    /// **Reset Process:**
    /// 1. User receives email with reset link containing token and email
    /// 2. User clicks link and is redirected to Angular password reset page
    /// 3. User enters new password
    /// 4. Angular app calls this endpoint with email, token, and new password
    /// 5. Token is validated and password is updated
    /// 
    /// **Password Requirements** (same as registration):
    /// - At least 8 characters long
    /// - Contains at least one uppercase letter
    /// - Contains at least one lowercase letter
    /// - Contains at least one digit
    /// 
    /// **Business Rules:**
    /// - Token must be valid and not expired (1-hour expiration)
    /// - Token can only be used once
    /// - New password must meet strength requirements
    /// - User must exist in the system
    /// - After successful reset, user can immediately login with new password
    /// 
    /// **Security Features:**
    /// - Token is single-use (becomes invalid after successful reset)
    /// - Token expires after 1 hour
    /// - Failed attempts are logged
    /// - Password is hashed before storage
    /// 
    /// **Implementation Notes:**
    /// 1. Extract email, token, and newPassword from request
    /// 2. Validate newPassword meets requirements
    /// 3. Call AuthService.ResetPasswordAsync(email, token, newPassword)
    /// 4. Service uses UserManager.ResetPasswordAsync(user, token, newPassword)
    /// 5. Return success or appropriate error
    /// </remarks>
    /// <param name="request">Request containing email, reset token, and new password</param>
    /// <returns>Returns success message upon successful password reset</returns>
    /// <response code="200">Password successfully reset. User can now login with the new password.</response>
    /// <response code="400">Invalid request. Token is invalid, expired, or new password doesn't meet requirements.</response>
    /// <response code="404">User with the specified email was not found.</response>
    /// <response code="500">Internal server error occurred during password reset.</response>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
    {
        // Sprint 0 - Story 7: Reset Password (Using Link)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword);

            if (!result)
            {
                return BadRequest(new { message = "Invalid or expired reset token" });
            }

            _logger.LogInformation("Password reset successfully for: {Email}", request.Email);

            return Ok(new { success = true, message = "Password reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during password reset" });
        }
    }

    /// <summary>
    /// Changes password for an authenticated user
    /// </summary>
    /// <remarks>
    /// Allows authenticated users to change their password by providing current and new passwords.
    /// 
    /// **User Story**: [M] Update Password (Logged-In) (Sprint 0 - Story 8)
    /// 
    /// **Authentication Required**: Yes (JWT Bearer token)
    /// 
    /// **Change Password Flow:**
    /// 1. User must be authenticated (valid JWT token required)
    /// 2. User provides current password for verification
    /// 3. User provides new password
    /// 4. Current password is validated
    /// 5. New password is applied
    /// 
    /// **New Password Requirements** (same as registration):
    /// - At least 8 characters long
    /// - Contains at least one uppercase letter
    /// - Contains at least one lowercase letter
    /// - Contains at least one digit
    /// 
    /// **Business Rules:**
    /// - User must be authenticated with valid JWT token
    /// - Current password must match user's existing password
    /// - New password must be different from current password
    /// - New password must meet strength requirements
    /// - User remains logged in after password change (token still valid)
    /// 
    /// **Security Features:**
    /// - Current password verification prevents unauthorized changes
    /// - Password history may be enforced (optional)
    /// - Failed attempts are logged
    /// - New password is hashed before storage
    /// 
    /// **Implementation Notes:**
    /// 1. Get current user ID from JWT claims: User.FindFirst(ClaimTypes.NameIdentifier)?.Value
    /// 2. Extract currentPassword and newPassword from request
    /// 3. Validate newPassword meets requirements
    /// 4. Call AuthService.ChangePasswordAsync(userId, currentPassword, newPassword)
    /// 5. Service uses UserManager.ChangePasswordAsync()
    /// 6. Return success or appropriate error
    /// </remarks>
    /// <param name="request">Request containing current password and new password</param>
    /// <returns>Returns success message upon successful password change</returns>
    /// <response code="200">Password successfully changed.</response>
    /// <response code="400">Invalid request. New password doesn't meet requirements or validation failed.</response>
    /// <response code="401">Current password is incorrect or user is not authenticated.</response>
    /// <response code="500">Internal server error occurred during password change.</response>
    [Authorize] // Requires JWT authentication
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        // Sprint 0 - Story 8: Update Password (Logged-In)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user has a password
            var user = await _userManager.FindByIdAsync(userId);
            var hasPassword = user != null && await _userManager.HasPasswordAsync(user);
            
            // Use empty string for current password if user doesn't have one
            var currentPassword = hasPassword ? request.CurrentPassword : string.Empty;
            
            var result = await _authService.ChangePasswordAsync(userId, currentPassword, request.NewPassword);

            if (!result)
            {
                return BadRequest(new { message = hasPassword ? "Current password is incorrect" : "Failed to set password" });
            }

            _logger.LogInformation("Password {Action} successfully for user: {UserId}", 
                hasPassword ? "changed" : "set", userId);

            return Ok(new { 
                success = true, 
                message = hasPassword ? "Password changed successfully" : "Password set successfully. You can now login with email and password." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change");
            return StatusCode(500, new { message = "An error occurred during password change" });
        }
    }

    /// <summary>
    /// Validates the authenticity of a JWT token
    /// </summary>
    /// <remarks>
    /// Utility endpoint to verify if a JWT token is valid and retrieve user information.
    /// 
    /// **Authentication Required**: Yes (JWT Bearer token)
    /// 
    /// **Use Cases:**
    /// - Frontend token validation on app initialization
    /// - Verify token before making sensitive operations
    /// - Refresh user information from token claims
    /// - Check if user session is still valid
    /// 
    /// **Response Data:**
    /// - User ID from token claims
    /// - User email from token claims
    /// - User roles from token claims
    /// - Token expiration time (optional)
    /// 
    /// **Business Rules:**
    /// - Token must be valid and not expired
    /// - Token signature must be valid
    /// - User account must still be active
    /// 
    /// **Implementation Notes:**
    /// - Validation is automatically handled by [Authorize] attribute
    /// - If this endpoint is reached, token is valid
    /// - Extract user information from User.Claims
    /// - Return user ID, email, and roles
    /// </remarks>
    /// <returns>Returns user information extracted from the valid JWT token</returns>
    /// <response code="200">Token is valid. Returns user information from token claims.</response>
    /// <response code="401">Token is invalid, expired, or missing.</response>
    [Authorize]
    [HttpGet("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateTokenAsync()
    {
        // Sprint 0 - Utility endpoint
        // 1. Get the ID from the Token (The only thing we trust from the token is the ID)
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Invalid token claims." });
        }

        // 2. FRESHNESS CHECK: Query the database
        var user = await _userManager.FindByIdAsync(userId);

        // Security Check: If the token is valid, but the user was DELETED from the DB...
        if (user == null)
        {
            // ...we must reject the request.
            return Unauthorized(new { message = "User account no longer exists." });
        }

        // 3. GET ROLES: Fetch the latest roles from the DB
        var roles = await _userManager.GetRolesAsync(user);

        // 4. Return the fresh data
        return Ok(new
        {
            success = true,
            message = "User is authenticated",
            user = new
            {
                id = user.Id,
                email = user.Email,
                name = user.FullName, // Assuming your ApplicationUser has this property
                roles, // Returns an array ["Admin", "Host"]
                hasPassword = !string.IsNullOrEmpty(user.PasswordHash)
            }
        });
    }


    /// <summary>
    /// Upgrades the currently authenticated user to a Host.
    /// </summary>
    /// <remarks>
    /// The user must be authenticated. This adds the "Host" role to their existing roles.
    /// Returns a new JWT token that includes the "Host" role.
    /// </remarks>
    /// <returns>A new AuthResult with an updated token.</returns>
    /// <response code="200">Successfully upgraded to Host.</response>
    /// <response code="400">User is already a Host or failed to add role.</response>
    /// <response code="401">User is not authenticated.</response>
    [HttpPost("become-host")]
    [Authorize] // Only an already logged-in user can do this
    public async Task<IActionResult> BecomeHost()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token.");
        }

        var result = await _authService.BecomeHostAsync(userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }


    [HttpPost("refresh-token")]
    [AllowAnonymous] // Crucial: The user is technically "unauthorized" (token expired), so we must allow anonymous access
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)] // Returns new tokens
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto request)
    {
        // Sprint 0 - Story 9: Refresh Token (Keep user logged in)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // The Service needs to:
            // 1. Verify the Access Token structure (even if expired).
            // 2. Check if the Refresh Token exists in DB and is active (not used/revoked).
            // 3. Mark old Refresh Token as "Used".
            // 4. Generate NEW Access Token + NEW Refresh Token.
            var result = await _authService.RefreshTokenAsync(request.Token, request.RefreshToken);

            if (!result.Success)
            {
                // SECURITY TIP: Even if it fails, sometimes we return generic errors, 
                // but for Refresh Tokens, 400 Bad Request is usually fine.
                return BadRequest(new { message = result.Message, errors = result.Errors });
            }

            // Return the fresh pair
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "An error occurred during token refresh" });
        }
    }


    /// <summary>
    /// Confirms user email address using token from email
    /// </summary>
    /// <remarks>
    /// This endpoint is called by the frontend after the user clicks the confirmation link.
    /// The frontend extracts `userId` and `token` from URL parameters and sends them in the request body.
    /// 
    /// **Security Notes**:
    /// - Uses POST to prevent accidental triggering
    /// - Token is validated by ASP.NET Core Identity
    /// - Idempotent: safe to call multiple times
    /// </remarks>
    /// <param name="request">Confirmation request with userId and token</param>
    /// <returns>Success message if email confirmed</returns>
    /// <response code="200">Email confirmed successfully</response>
    /// <response code="400">Invalid request (missing userId/token)</response>
    /// <response code="404">User not found</response>
    /// <response code="400">Invalid or expired token</response>
    [HttpPost("confirm-email")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.ConfirmEmailAsync(request.UserId, request.Token);

            if (!result.Success)
            {
                _logger.LogWarning("Email confirmation failed for user {UserId}", request.UserId);
                return BadRequest(new { message = result.Message, errors = result.Errors });
            }

            _logger.LogInformation("Email confirmed successfully for user {UserId}", request.UserId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email confirmation for user {UserId}", request.UserId);
            return StatusCode(500, new { message = "An error occurred during email confirmation." });
        }
    }

    [HttpPost("resend-confirmation-email")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationEmailDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _authService.ResendConfirmationEmailAsync(request.Email);

            // Always return success for security
            return Ok(new
            {
                success = true,
                message = "If the account exists and is not confirmed, a new confirmation email has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during resend confirmation email for: {Email}", request.Email);
            // Return success even on error to prevent enumeration
            return Ok(new
            {
                success = true,
                message = "If the account exists and is not confirmed, a new confirmation email has been sent."
            });
        }
    }
}

