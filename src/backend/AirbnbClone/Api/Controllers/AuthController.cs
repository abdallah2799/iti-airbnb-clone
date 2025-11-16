using Application.DTOs;
using Application.Services.Interfaces;
using Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Manages user authentication and authorization operations
/// </summary>
/// <remarks>
/// This controller provides comprehensive authentication functionality for the Airbnb Clone API,
/// including traditional email/password authentication and OAuth 2.0 integration with Google.
/// 
/// **Key Features:**
/// - User registration (email and Google OAuth)
/// - User authentication (email and Google OAuth)
/// - Password management (forgot, reset, change)
/// - JWT token generation and validation
/// - Secure session management
/// 
/// **Sprint 0 Implementation:**
/// All endpoints map to specific user stories in Sprint 0 for authentication and authorization.
/// 
/// **Security:**
/// - Passwords are hashed using ASP.NET Core Identity
/// - JWT tokens include claims for user ID, email, and roles
/// - Token expiration is configurable (default: 24 hours)
/// - Failed login attempts are logged for security monitoring
/// - Password reset tokens expire after 1 hour
/// 
/// **Related Components:**
/// - [`IAuthService`](../Application/Services/Interfaces/IAuthService.cs) - Authentication business logic
/// - [`IEmailService`](../Application/Services/Interfaces/IEmailService.cs) - Email notifications
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        IAuthService authService,
        IEmailService emailService,
        ILogger<AuthController> logger,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        _authService = authService;
        _emailService = emailService;
        _logger = logger;
        _signInManager = signInManager;
        _userManager = userManager;
        _configuration = configuration;
    }

    /// <summary>
    /// Registers a new user account with email and password
    /// </summary>
    /// <remarks>
    /// Creates a new user account using email and password credentials. Upon successful registration,
    /// the user is automatically logged in and receives a JWT token.
    /// 
    /// **User Story:** [M] Register with Email (Sprint 0 - Story 1)
    /// 
    /// **Password Requirements:**
    /// - Minimum 8 characters
    /// - At least one uppercase letter (A-Z)
    /// - At least one lowercase letter (a-z)
    /// - At least one digit (0-9)
    /// - Special characters are optional but recommended
    /// 
    /// **Business Rules:**
    /// - Email must be unique across all users
    /// - Email format must be valid (RFC 5322 compliant)
    /// - User account is created with "Guest" role by default
    /// - Email confirmation is optional (configurable)
    /// - Full name is stored as a combined field
    /// 
    /// **Registration Flow:**
    /// 1. Validate request model (email format, password strength, required fields)
    /// 2. Check if email already exists in the system
    /// 3. Create user account with hashed password
    /// 4. Assign default "Guest" role to user
    /// 5. Generate JWT authentication token
    /// 6. Return user information and token
    /// 
    /// **Security Features:**
    /// - Password is hashed using ASP.NET Core Identity (PBKDF2)
    /// - Email addresses are stored in lowercase
    /// - Account creation is logged for auditing
    /// - Failed registration attempts are monitored
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Registration successful",
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "user": {
    ///     "id": "user-guid",
    ///     "email": "user@example.com",
    ///     "fullName": "John Doe",
    ///     "role": "Guest"
    ///   }
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/login` - Login with registered credentials
    /// - `POST /api/auth/register/google` - Register using Google OAuth
    /// </remarks>
    /// <param name="request">Registration request containing email, password, and full name</param>
    /// <returns>Returns the newly registered user information and JWT authentication token</returns>
    /// <response code="200">User successfully registered. Returns user details and JWT token for immediate authentication.</response>
    /// <response code="400">Invalid request data. Possible issues: invalid email format, weak password (doesn't meet requirements), missing required fields (email, password, fullName), or password and confirmPassword don't match.</response>
    /// <response code="409">Email address already exists. The provided email is already registered in the system. User should login instead or use password recovery.</response>
    /// <response code="500">Internal server error occurred during registration process. Issue has been logged. Contact support if problem persists.</response>
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
                if (result.Errors.Any(e => e.Contains("already")))
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
    /// Registers or authenticates a user using Google OAuth 2.0
    /// </summary>
    /// <remarks>
    /// Creates a new user account or authenticates an existing user using Google OAuth token.
    /// This endpoint supports both new registrations and returning user logins.
    /// 
    /// **User Story:** [M] Register with Google (Sprint 0 - Story 2)
    /// 
    /// **OAuth Flow:**
    /// 1. Frontend obtains Google ID token using Google Sign-In JavaScript library
    /// 2. Frontend sends the ID token to this endpoint
    /// 3. Backend validates the token with Google's token verification API
    /// 4. Backend creates new user or finds existing user by Google ID
    /// 5. Backend generates JWT token for the application
    /// 6. User is authenticated and can access protected resources
    /// 
    /// **Business Rules:**
    /// - Google token must be valid and not expired (validated by Google API)
    /// - Email from Google account is used as the user's email
    /// - User profile info (name, photo URL) is populated from Google account
    /// - User is created with "Guest" role by default
    /// - If user already exists with this Google ID, they are logged in
    /// - Google ID is stored as external login provider link
    /// 
    /// **Google Token Requirements:**
    /// - Must be obtained from Google Sign-In client library
    /// - Must include email and profile scopes
    /// - Must be sent immediately after generation (tokens are short-lived)
    /// - Client ID must match the configured Google OAuth client ID
    /// 
    /// **Security Features:**
    /// - Token is validated directly with Google's servers
    /// - Email addresses are verified by Google
    /// - OAuth flow prevents password management vulnerabilities
    /// - External login is linked to user account
    /// 
    /// **Configuration Required:**
    /// - Google OAuth Client ID in `appsettings.json`
    /// - Google OAuth Client Secret in `appsettings.json`
    /// - Authorized redirect URIs configured in Google Cloud Console
    /// 
    /// **Implementation Notes:**
    /// 1. Extract Google ID token from request
    /// 2. Validate token with Google API
    /// 3. Call `AuthService.RegisterWithGoogleAsync(googleToken)`
    /// 4. Service creates/finds user and issues JWT
    /// 5. Return user information and JWT token
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Google authentication successful",
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "user": {
    ///     "id": "user-guid",
    ///     "email": "user@gmail.com",
    ///     "fullName": "John Doe",
    ///     "profilePictureUrl": "https://lh3.googleusercontent.com/...",
    ///     "role": "Guest"
    ///   }
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/login/google` - Login with existing Google account
    /// </remarks>
    /// <param name="request">Google authentication request containing the Google ID token obtained from Google Sign-In</param>
    /// <returns>Returns user information and JWT authentication token</returns>
    /// <response code="200">User successfully authenticated with Google. Returns user details and JWT token. Works for both new registrations and existing users.</response>
    /// <response code="400">Invalid Google token. Possible issues: token is expired, token is malformed, token signature is invalid, or client ID doesn't match. Obtain a new token from Google Sign-In.</response>
    /// <response code="500">Internal server error occurred during Google authentication. This could be due to Google API connectivity issues or database errors. Issue has been logged.</response>
    [HttpPost("register/google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RegisterWithGoogle([FromBody] GoogleAuthDto request)
    {
        // Sprint 0 - Story 2: Register with Google
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

            _logger.LogInformation("User registered with Google successfully");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google registration");
            return StatusCode(500, new { message = "An error occurred during Google registration" });
        }
    }

    /// <summary>
    /// Authenticates a user with email and password credentials
    /// </summary>
    /// <remarks>
    /// Validates user credentials and returns a JWT authentication token upon successful authentication.
    /// This is the primary login method for users who registered with email and password.
    /// 
    /// **User Story:** [M] Login with Email (Sprint 0 - Story 3)
    /// 
    /// **Authentication Process:**
    /// 1. Validates email and password credentials against stored user data
    /// 2. Checks if the user account is active and not locked
    /// 3. Updates the user's last login timestamp
    /// 4. Generates a JWT token with user claims (ID, email, roles)
    /// 5. Returns user information and authentication token
    /// 
    /// **Business Rules:**
    /// - Email and password must match an existing user account
    /// - Account must not be locked or disabled
    /// - Account lockout may occur after multiple failed attempts (configurable)
    /// - JWT token expires after configured duration (default: 24 hours from `appsettings.json`)
    /// - Case-insensitive email matching
    /// 
    /// **Security Features:**
    /// - Password is never returned in any response
    /// - Failed login attempts are logged for security monitoring
    /// - Account lockout protection against brute force attacks
    /// - Passwords are compared using secure hashing (PBKDF2)
    /// - JWT tokens include encrypted claims
    /// - Tokens are signed with server secret key
    /// 
    /// **Token Claims:**
    /// The JWT token includes the following claims:
    /// - `nameid` - User ID (GUID)
    /// - `email` - User email address
    /// - `name` - User full name
    /// - `role` - User role(s)
    /// - `exp` - Token expiration time
    /// - `iss` - Token issuer (API)
    /// - `aud` - Token audience (client app)
    /// 
    /// **Implementation Notes:**
    /// 1. Validate request (email and password present)
    /// 2. Call `AuthService.LoginWithEmailAsync(email, password)`
    /// 3. Service validates credentials using UserManager
    /// 4. Update LastLoginAt timestamp in database
    /// 5. Generate JWT token with claims
    /// 6. Return user information and token
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Login successful",
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "user": {
    ///     "id": "user-guid",
    ///     "email": "user@example.com",
    ///     "fullName": "John Doe",
    ///     "role": "Guest"
    ///   }
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/register` - Register a new account
    /// - `POST /api/auth/forgot-password` - Reset forgotten password
    /// - `GET /api/auth/validate` - Validate JWT token
    /// </remarks>
    /// <param name="request">Login request containing user email and password</param>
    /// <returns>Returns user information and JWT authentication token valid for 24 hours</returns>
    /// <response code="200">User successfully authenticated. Returns user details and JWT token that should be included in the Authorization header for subsequent requests.</response>
    /// <response code="400">Invalid request data. Either email or password is missing, or the request format is incorrect. Check that both fields are provided.</response>
    /// <response code="401">Invalid credentials. The email and password combination is incorrect. Verify credentials and try again. Account may be locked after multiple failed attempts.</response>
    /// <response code="403">Account is locked or disabled. This could be due to too many failed login attempts, administrative action, or account suspension. Contact support for assistance.</response>
    /// <response code="500">Internal server error occurred during authentication. Database or service connectivity issue. Error has been logged and support has been notified.</response>
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
    /// Authenticates a user using Google OAuth 2.0
    /// </summary>
    /// <remarks>
    /// Authenticates an existing user account using Google OAuth token. User must have
    /// previously registered using Google or linked their Google account.
    /// 
    /// **User Story:** [M] Login with Google (Sprint 0 - Story 4)
    /// 
    /// **OAuth Flow:**
    /// 1. Frontend obtains Google ID token using Google Sign-In JavaScript library
    /// 2. Frontend sends the ID token to this endpoint
    /// 3. Backend validates the token with Google's token verification API
    /// 4. Backend finds user by Google ID or email
    /// 5. Backend generates JWT token for the application
    /// 6. User is authenticated and can access protected resources
    /// 
    /// **Business Rules:**
    /// - User must have previously registered with Google
    /// - Google token must be valid and not expired (validated by Google API)
    /// - If user is not found, returns 404 (must register first)
    /// - Updates last login timestamp on successful authentication
    /// - User email must match the email in the Google account
    /// 
    /// **Difference from Registration:**
    /// - This endpoint expects an existing user account
    /// - Returns 404 if user doesn't exist
    /// - Does not create new user accounts
    /// - Use `POST /api/auth/register/google` for new users
    /// 
    /// **Implementation Notes:**
    /// 1. Extract Google ID token from request
    /// 2. Validate token with Google API
    /// 3. Call `AuthService.LoginWithGoogleAsync(googleToken)`
    /// 4. Find user by Google external login info
    /// 5. Generate and return JWT token
    /// 6. Update last login timestamp
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Login successful",
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "user": {
    ///     "id": "user-guid",
    ///     "email": "user@gmail.com",
    ///     "fullName": "John Doe",
    ///     "profilePictureUrl": "https://lh3.googleusercontent.com/...",
    ///     "role": "Guest"
    ///   }
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/register/google` - Register new account with Google
    /// </remarks>
    /// <param name="request">Google authentication request containing the Google ID token</param>
    /// <returns>Returns user information and JWT authentication token</returns>
    /// <response code="200">User successfully authenticated with Google. Returns user details and JWT token.</response>
    /// <response code="400">Invalid Google token. Token is expired, malformed, or signature is invalid. Obtain a new token from Google Sign-In.</response>
    /// <response code="404">User not found. No account exists with this Google account. User must register first using POST /api/auth/register/google.</response>
    /// <response code="500">Internal server error occurred during Google authentication. Google API connectivity or database issue. Error has been logged.</response>
    [HttpPost("login/google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleAuthDto request)
    {
        // Sprint 0 - Story 4: Login with Google (Optional for MVP)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var token = await _authService.LoginWithGoogleAsync(request.GoogleToken);
            
            if (token == null)
            {
                return NotFound(new { message = "User not found. Please register first." });
            }

            _logger.LogInformation("User logged in with Google successfully");

            return Ok(new { success = true, message = "Login successful", token });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google login");
            return StatusCode(500, new { message = "An error occurred during Google login" });
        }
    }

    /// <summary>
    /// Initiates the password reset process by sending a reset link to user's email
    /// </summary>
    /// <remarks>
    /// Generates a secure password reset token and sends an email with reset instructions.
    /// This is the first step in the password recovery flow for users who forgot their password.
    /// 
    /// **User Story:** [M] Forgot Password Request (Sprint 0 - Story 6)
    /// 
    /// **Reset Flow:**
    /// 1. User provides their email address
    /// 2. System generates a secure reset token (expires in 1 hour)
    /// 3. Email is sent with reset link: `{FrontendUrl}/reset-password?token={token}&amp;email={email}`
    /// 4. User clicks the link and is redirected to Angular password reset page
    /// 5. User submits new password via `POST /api/auth/reset-password` endpoint
    /// 
    /// **Security Measures:**
    /// - Always returns success message, even if email doesn't exist (prevents email enumeration attacks)
    /// - Reset token expires after 1 hour
    /// - Token can only be used once
    /// - Token is cryptographically secure (generated by ASP.NET Core Identity)
    /// - Rate limiting prevents abuse (configurable)
    /// - All reset attempts are logged for security monitoring
    /// 
    /// **Business Rules:**
    /// - Email must be in valid format
    /// - Generic success message returned for security (doesn't reveal if email exists)
    /// - If email doesn't exist, no email is sent but success is still returned
    /// - Multiple requests generate new tokens (old ones become invalid)
    /// - User can request password reset even if account is temporarily locked
    /// 
    /// **Email Content:**
    /// The password reset email includes:
    /// - Secure reset link with token
    /// - Token expiration time (1 hour)
    /// - Security notice about not sharing the link
    /// - Instructions on what to do if they didn't request the reset
    /// 
    /// **Implementation Notes:**
    /// 1. Extract and validate email from request
    /// 2. Call `AuthService.ForgotPasswordAsync(email)`
    /// 3. Service generates reset token using `UserManager.GeneratePasswordResetTokenAsync()`
    /// 4. Service calls `EmailService.SendPasswordResetEmailAsync(email, token)`
    /// 5. Return success message regardless of email existence
    /// 
    /// **Rate Limiting:**
    /// - Maximum 3 requests per email address per hour
    /// - Maximum 10 requests per IP address per hour
    /// - 429 status code returned if limits exceeded
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/reset-password` - Complete password reset with token
    /// - `POST /api/auth/change-password` - Change password for logged-in users
    /// </remarks>
    /// <param name="request">Forgot password request containing the user's email address</param>
    /// <returns>Returns success message indicating email has been sent (if email exists)</returns>
    /// <response code="200">Password reset email sent successfully (if email exists in system). Check your inbox and spam folder. Email is valid for 1 hour.</response>
    /// <response code="400">Invalid request data. Email format is invalid or missing. Provide a valid email address.</response>
    /// <response code="429">Too many password reset requests. Rate limit exceeded. Please wait before requesting another password reset. Limit: 3 requests per hour per email.</response>
    /// <response code="500">Internal server error occurred while processing the password reset request. Email service may be temporarily unavailable. Error has been logged.</response>
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
                message = "If your email exists in our system, you will receive a password reset link shortly. Please check your inbox and spam folder." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password request: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Resets user password using a valid reset token from email
    /// </summary>
    /// <remarks>
    /// Completes the password reset process using the token sent via email.
    /// This is the second step in the password recovery flow.
    /// 
    /// **User Story:** [M] Reset Password (Using Link) (Sprint 0 - Story 7)
    /// 
    /// **Reset Process:**
    /// 1. User receives email with reset link containing token and email
    /// 2. User clicks link and is redirected to Angular password reset page
    /// 3. User enters new password in the form
    /// 4. Angular app calls this endpoint with email, token, and new password
    /// 5. Token is validated and password is updated
    /// 6. User can immediately login with the new password
    /// 
    /// **Password Requirements** (same as registration):
    /// - Minimum 8 characters
    /// - At least one uppercase letter (A-Z)
    /// - At least one lowercase letter (a-z)
    /// - At least one digit (0-9)
    /// - Special characters are optional but recommended
    /// 
    /// **Business Rules:**
    /// - Token must be valid and not expired (1-hour expiration)
    /// - Token can only be used once (becomes invalid after successful reset)
    /// - New password must meet strength requirements
    /// - User must exist in the system
    /// - After successful reset, user can immediately login with new password
    /// - Old password is completely replaced (not stored in history)
    /// 
    /// **Security Features:**
    /// - Token is single-use (becomes invalid after successful reset)
    /// - Token expires after 1 hour
    /// - Failed attempts are logged for security monitoring
    /// - Password is hashed before storage using PBKDF2
    /// - Token is validated against user's security stamp
    /// - Password history is not maintained (optional feature)
    /// 
    /// **Implementation Notes:**
    /// 1. Extract email, token, and newPassword from request
    /// 2. Validate newPassword meets strength requirements
    /// 3. Call `AuthService.ResetPasswordAsync(email, token, newPassword)`
    /// 4. Service uses `UserManager.ResetPasswordAsync(user, token, newPassword)`
    /// 5. Invalidate the token after successful reset
    /// 6. Return success or appropriate error message
    /// 
    /// **Common Error Scenarios:**
    /// - Token expired (after 1 hour) - request new token
    /// - Token already used - request new token
    /// - Invalid token format - ensure token wasn't modified
    /// - User not found - email may be incorrect
    /// - Password doesn't meet requirements - check password rules
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Password has been reset successfully. You can now login with your new password."
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/forgot-password` - Request password reset token
    /// - `POST /api/auth/login` - Login with new password
    /// </remarks>
    /// <param name="request">Request containing email, reset token from email, and new password</param>
    /// <returns>Returns success message upon successful password reset</returns>
    /// <response code="200">Password successfully reset. User can now login with the new password using POST /api/auth/login.</response>
    /// <response code="400">Invalid request. Possible issues: token is invalid or expired (request new token via forgot-password), token was already used, new password doesn't meet requirements (8+ chars, mixed case, digit), or password and confirmPassword don't match.</response>
    /// <response code="404">User with the specified email was not found. Verify the email address is correct.</response>
    /// <response code="500">Internal server error occurred during password reset. Database update failed. Error has been logged. Try again or contact support.</response>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
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

            return Ok(new 
            { 
                success = true, 
                message = "Password has been reset successfully. You can now login with your new password." 
            });
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
    /// This is different from password reset, which is for users who forgot their password.
    /// 
    /// **User Story:** [M] Update Password (Logged-In) (Sprint 0 - Story 8)
    /// 
    /// **Authentication Required:** Yes (JWT Bearer token in Authorization header)
    /// 
    /// **Change Password Flow:**
    /// 1. User must be authenticated with valid JWT token
    /// 2. User provides current password for verification (security measure)
    /// 3. User provides new password (must meet requirements)
    /// 4. Current password is validated against stored hash
    /// 5. New password is hashed and stored
    /// 6. User remains logged in (existing tokens remain valid)
    /// 
    /// **New Password Requirements** (same as registration):
    /// - Minimum 8 characters
    /// - At least one uppercase letter (A-Z)
    /// - At least one lowercase letter (a-z)
    /// - At least one digit (0-9)
    /// - Special characters are optional but recommended
    /// - Must be different from current password
    /// 
    /// **Business Rules:**
    /// - User must be authenticated with valid JWT token
    /// - Current password must match user's existing password
    /// - New password must be different from current password
    /// - New password must meet strength requirements
    /// - User remains logged in after password change (token still valid)
    /// - All other active sessions remain valid (tokens not invalidated)
    /// 
    /// **Security Features:**
    /// - Current password verification prevents unauthorized changes
    /// - Password history can be enforced (optional feature for production)
    /// - Failed attempts are logged for security monitoring
    /// - New password is hashed using PBKDF2 before storage
    /// - User ID extracted from JWT token (not from request body)
    /// - Requires valid authentication token
    /// 
    /// **Implementation Notes:**
    /// 1. Get current user ID from JWT claims: `User.FindFirst(ClaimTypes.NameIdentifier)?.Value`
    /// 2. Extract currentPassword and newPassword from request
    /// 3. Validate newPassword meets strength requirements
    /// 4. Call `AuthService.ChangePasswordAsync(userId, currentPassword, newPassword)`
    /// 5. Service uses `UserManager.ChangePasswordAsync(user, currentPassword, newPassword)`
    /// 6. Return success or appropriate error message
    /// 
    /// **Difference from Reset Password:**
    /// - Requires authentication (JWT token)
    /// - Requires current password (for verification)
    /// - No email token required
    /// - User is already logged in
    /// - Used when user knows their current password
    /// 
    /// **Common Error Scenarios:**
    /// - Current password incorrect - verify password
    /// - New password same as current - choose different password
    /// - New password doesn't meet requirements - check password rules
    /// - Token expired - login again to get new token
    /// - User not found - token may be invalid
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Password changed successfully"
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/forgot-password` - For users who forgot their password
    /// - `POST /api/auth/reset-password` - Reset password using email token
    /// </remarks>
    /// <param name="request">Request containing current password and new password</param>
    /// <returns>Returns success message upon successful password change</returns>
    /// <response code="200">Password successfully changed. User can continue using the application with the new password. Current JWT token remains valid.</response>
    /// <response code="400">Invalid request. Possible issues: new password doesn't meet requirements (8+ chars, mixed case, digit), password and confirmPassword don't match, or new password is same as current password.</response>
    /// <response code="401">Authentication failed. Possible issues: current password is incorrect (verify and try again), user is not authenticated (JWT token missing or invalid), or JWT token has expired (login again).</response>
    /// <response code="500">Internal server error occurred during password change. Database update failed. Error has been logged. Try again or contact support.</response>
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
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            
            if (!result)
            {
                return Unauthorized(new { message = "Current password is incorrect" });
            }

            _logger.LogInformation("Password changed successfully for user: {UserId}", userId);

            return Ok(new { success = true, message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change");
            return StatusCode(500, new { message = "An error occurred during password change" });
        }
    }

    /// <summary>
    /// Validates the authenticity and expiration of a JWT token
    /// </summary>
    /// <remarks>
    /// Utility endpoint to verify if a JWT token is valid and retrieve user information from the token.
    /// Useful for frontend token validation and session management.
    /// 
    /// **Authentication Required:** Yes (JWT Bearer token in Authorization header)
    /// 
    /// **Use Cases:**
    /// - Frontend token validation on application initialization
    /// - Verify token before making sensitive operations
    /// - Refresh user information from token claims
    /// - Check if user session is still valid (token not expired)
    /// - Silent authentication checks without full login
    /// 
    /// **Response Data:**
    /// Returns extracted information from the JWT token:
    /// - User ID from `nameid` claim
    /// - User email from `email` claim
    /// - User name from `name` claim
    /// - User roles from `role` claim(s)
    /// - Token expiration time (optional)
    /// 
    /// **Business Rules:**
    /// - Token must be valid (signature verified)
    /// - Token must not be expired
    /// - User account must still be active
    /// - Token issuer and audience must match configuration
    /// 
    /// **Security Features:**
    /// - Token signature is cryptographically verified
    /// - Token expiration is checked automatically
    /// - Invalid tokens return 401 Unauthorized
    /// - Token cannot be forged or tampered with
    /// - Validation is performed by `[Authorize]` attribute
    /// 
    /// **Implementation Notes:**
    /// - Validation is automatically handled by `[Authorize]` attribute
    /// - If this endpoint is reached, token is already validated
    /// - Extract user information from `User.Claims` collection
    /// - Return user ID, email, name, and roles
    /// - No database lookup required (claims are in token)
    /// 
    /// **Token Format:**
    /// Include token in Authorization header:
    /// ```
    /// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    /// ```
    /// 
    /// **Response Structure:**
    /// ```json
    /// {
    ///   "success": true,
    ///   "message": "Token is valid",
    ///   "user": {
    ///     "id": "user-guid",
    ///     "email": "user@example.com",
    ///     "name": "John Doe",
    ///     "role": "Guest"
    ///   }
    /// }
    /// ```
    /// 
    /// **Common Use in Frontend:**
    /// ```typescript
    /// // Check if user is authenticated on app init
    /// const isAuthenticated = await authService.validateToken();
    /// if (!isAuthenticated) {
    ///   router.navigate(['/login']);
    /// }
    /// ```
    /// 
    /// **Related Endpoints:**
    /// - `POST /api/auth/login` - Obtain JWT token
    /// - `POST /api/auth/register` - Register and obtain JWT token
    /// </remarks>
    /// <returns>Returns user information extracted from the valid JWT token</returns>
    /// <response code="200">Token is valid. Returns user information from token claims (ID, email, name, roles). Token has not expired.</response>
    /// <response code="401">Token is invalid, expired, or missing. Possible issues: token signature is invalid, token has expired, token is malformed, Authorization header is missing, or token issuer/audience doesn't match. User must login again to obtain a new token.</response>
    [Authorize]
    [HttpGet("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public IActionResult ValidateToken()
    {
        // Sprint 0 - Utility endpoint
        // If execution reaches here, token is valid (handled by [Authorize] attribute)
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        return Ok(new 
        { 
            success = true,
            message = "Token is valid",
            user = new 
            {
                id = userId,
                email = email,
                name = name
            }
        });
    }
}
