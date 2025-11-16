# API Documentation Standards

This document defines the standards and best practices for documenting all API endpoints in the Airbnb Clone project. Following these guidelines ensures consistency, clarity, and maintainability across our API documentation.

## Table of Contents
- [Overview](#overview)
- [XML Documentation Requirements](#xml-documentation-requirements)
- [Controller Documentation](#controller-documentation)
- [Endpoint Documentation](#endpoint-documentation)
- [Request/Response Models](#requestresponse-models)
- [Status Codes](#status-codes)
- [Examples](#examples)

---

## Overview

All API endpoints **MUST** be documented using XML comments that will be automatically rendered in our Scalar API documentation UI. This provides interactive, searchable documentation for all developers and consumers of our API.

### Key Principles
1. **Be Descriptive**: Write clear, concise descriptions
2. **Be Complete**: Document all parameters, responses, and edge cases
3. **Be Consistent**: Follow the standards outlined in this document
4. **Be Accurate**: Keep documentation in sync with implementation

---

## XML Documentation Requirements

### Enable XML Documentation
XML documentation is enabled in `Api.csproj`:
```xml
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

### XML Comment Tags
Use these standard XML tags for documentation:

- `<summary>` - Brief description of the method/property
- `<remarks>` - Additional details, implementation notes
- `<param name="paramName">` - Description of a parameter
- `<returns>` - Description of the return value
- `<response code="200">` - HTTP response status code description
- `<example>` - Code examples or sample data
- `<exception>` - Exceptions that may be thrown

---

## Controller Documentation

### Controller Class Documentation
Every controller **MUST** have a summary describing its purpose.

```csharp
/// <summary>
/// Manages user authentication operations including registration, login, password reset, and OAuth.
/// </summary>
/// <remarks>
/// This controller handles all authentication-related endpoints for the Airbnb Clone API.
/// Supports both traditional email/password authentication and Google OAuth.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    // Controller implementation
}
```

### Required Attributes
All controllers should include:
- `[ApiController]` - Enables API-specific behaviors
- `[Route("api/[controller]")]` - Defines the base route
- `[Produces("application/json")]` - Specifies response content type

---

## Endpoint Documentation

### Complete Endpoint Example

```csharp
/// <summary>
/// Registers a new user account
/// </summary>
/// <remarks>
/// Creates a new user account with the provided credentials. 
/// Password must meet the following requirements:
/// - At least 8 characters long
/// - Contains at least one uppercase letter
/// - Contains at least one lowercase letter
/// - Contains at least one digit
/// 
/// Upon successful registration, a confirmation email will be sent to the provided email address.
/// </remarks>
/// <param name="request">User registration information including email, password, first name, and last name</param>
/// <returns>Returns the newly created user information and authentication token</returns>
/// <response code="200">User successfully registered. Returns user details and JWT token.</response>
/// <response code="400">Invalid request data. Check validation errors in the response.</response>
/// <response code="409">Email address already exists in the system.</response>
/// <response code="500">Internal server error occurred during registration.</response>
[HttpPost("register")]
[AllowAnonymous]
[ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
{
    // Implementation
}
```

### Mandatory Elements for All Endpoints

#### 1. Summary
- **Required**: Yes
- **Format**: One sentence describing what the endpoint does
- Start with an action verb (e.g., "Creates", "Retrieves", "Updates", "Deletes")

```csharp
/// <summary>
/// Creates a new property listing
/// </summary>
```

#### 2. Remarks
- **Required**: For complex endpoints
- **Format**: Multi-line detailed explanation
- Include:
  - Business logic description
  - Validation rules
  - Side effects
  - Related endpoints

```csharp
/// <remarks>
/// Creates a new property listing for the authenticated host.
/// 
/// Business Rules:
/// - User must have a verified host account
/// - Property address must be unique
/// - At least one photo is required
/// - Pricing must be greater than $0
/// 
/// This endpoint triggers:
/// - Property verification workflow
/// - Host notification email
/// - Search index update
/// 
/// Related Endpoints:
/// - POST /api/Listings/{id}/photos - Upload listing photos
/// - PUT /api/Listings/{id} - Update listing details
/// </remarks>
```

#### 3. Parameters
- **Required**: For all parameters
- **Format**: Clear description of each parameter

```csharp
/// <param name="listingId">The unique identifier of the listing to retrieve</param>
/// <param name="request">Listing creation data including title, description, pricing, and amenities</param>
```

#### 4. Returns
- **Required**: Yes
- **Format**: Description of the return value

```csharp
/// <returns>Returns the newly created listing with its generated ID and status</returns>
```

#### 5. Response Codes
- **Required**: All possible response codes
- **Format**: HTTP status code with detailed description

```csharp
/// <response code="200">Listing successfully created. Returns the listing details.</response>
/// <response code="400">Invalid request data. Check validation errors.</response>
/// <response code="401">User is not authenticated.</response>
/// <response code="403">User does not have permission to create listings.</response>
/// <response code="500">Internal server error occurred.</response>
```

#### 6. ProducesResponseType Attributes
- **Required**: Yes, for all response codes
- **Format**: Include type and status code

```csharp
[ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
```

---

## Request/Response Models

### DTO Documentation

All DTOs (Data Transfer Objects) **MUST** be documented with XML comments.

```csharp
/// <summary>
/// Request model for user registration
/// </summary>
public class RegisterRequestDto
{
    /// <summary>
    /// User's email address. Must be unique and valid.
    /// </summary>
    /// <example>user@example.com</example>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// User's password. Must meet security requirements (8+ characters, mixed case, digits).
    /// </summary>
    /// <example>SecurePass123</example>
    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
    
    /// <summary>
    /// User's first name
    /// </summary>
    /// <example>John</example>
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's last name
    /// </summary>
    /// <example>Doe</example>
    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = string.Empty;
}
```

### DTO Documentation Requirements

1. **Class Summary**: Describe the purpose of the DTO
2. **Property Summary**: Describe each property
3. **Examples**: Provide sample values using `<example>` tags
4. **Validation**: Document validation rules in the summary

---

## Status Codes

### Standard HTTP Status Codes Usage

| Code | Usage | When to Use |
|------|-------|-------------|
| `200 OK` | Success | Successful GET, PUT, PATCH requests |
| `201 Created` | Resource created | Successful POST requests creating new resources |
| `204 No Content` | Success, no body | Successful DELETE requests |
| `400 Bad Request` | Client error | Invalid request data, validation failures |
| `401 Unauthorized` | Authentication required | Missing or invalid authentication token |
| `403 Forbidden` | Authorization failed | Authenticated but lacks permission |
| `404 Not Found` | Resource not found | Requested resource doesn't exist |
| `409 Conflict` | Resource conflict | Duplicate resource, business rule violation |
| `422 Unprocessable Entity` | Semantic error | Request well-formed but semantically incorrect |
| `500 Internal Server Error` | Server error | Unexpected server-side errors |

### Document ALL Possible Status Codes

Every endpoint must document **all** status codes it can return:

```csharp
/// <response code="200">Booking successfully created</response>
/// <response code="400">Invalid booking data (invalid dates, missing required fields)</response>
/// <response code="401">User is not authenticated</response>
/// <response code="403">User cannot book their own listing</response>
/// <response code="404">Listing not found</response>
/// <response code="409">Listing not available for selected dates</response>
/// <response code="422">Booking dates are in the past or check-out before check-in</response>
/// <response code="500">Internal server error occurred during booking process</response>
```

---

## Examples

### Complete Controller Example

```csharp
/// <summary>
/// Manages property listing operations including creation, retrieval, updates, and search.
/// </summary>
/// <remarks>
/// This controller handles all listing-related endpoints for the Airbnb Clone API.
/// Listings represent properties available for rent.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ListingsController : ControllerBase
{
    private readonly IListingRepository _listingRepository;
    private readonly ILogger<ListingsController> _logger;

    public ListingsController(
        IListingRepository listingRepository,
        ILogger<ListingsController> logger)
    {
        _listingRepository = listingRepository;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a specific listing by ID
    /// </summary>
    /// <remarks>
    /// Returns detailed information about a single property listing including:
    /// - Property details (title, description, type)
    /// - Location information
    /// - Pricing and availability
    /// - Amenities
    /// - Host information
    /// - Reviews and ratings
    /// 
    /// This endpoint is public and does not require authentication.
    /// </remarks>
    /// <param name="id">The unique identifier of the listing to retrieve</param>
    /// <returns>Returns the listing details if found</returns>
    /// <response code="200">Listing found and returned successfully</response>
    /// <response code="404">Listing with the specified ID was not found</response>
    /// <response code="500">Internal server error occurred</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetListing([FromRoute] int id)
    {
        _logger.LogInformation("Retrieving listing with ID: {ListingId}", id);
        
        var listing = await _listingRepository.GetByIdAsync(id);
        
        if (listing == null)
        {
            _logger.LogWarning("Listing with ID {ListingId} not found", id);
            return NotFound(new ProblemDetails 
            { 
                Title = "Listing not found",
                Detail = $"Listing with ID {id} does not exist",
                Status = StatusCodes.Status404NotFound
            });
        }
        
        return Ok(listing);
    }

    /// <summary>
    /// Creates a new property listing
    /// </summary>
    /// <remarks>
    /// Creates a new property listing for the authenticated host user.
    /// 
    /// **Business Rules:**
    /// - User must be authenticated and have host privileges
    /// - Property title must be unique for the host
    /// - At least one photo must be uploaded separately after creation
    /// - Price per night must be greater than $0
    /// - Property must have valid address information
    /// 
    /// **Post-Creation Steps:**
    /// 1. Upload photos using POST /api/Listings/{id}/photos
    /// 2. Set availability calendar using PUT /api/Listings/{id}/availability
    /// 3. Listing will be in "Draft" status until activated
    /// 
    /// **Triggers:**
    /// - Host notification email
    /// - Admin review queue (for first listing)
    /// </remarks>
    /// <param name="request">Property listing details including title, description, location, pricing, and amenities</param>
    /// <returns>Returns the newly created listing with its generated ID</returns>
    /// <response code="201">Listing successfully created. Returns the created listing details.</response>
    /// <response code="400">Invalid request data. Check validation errors in the response.</response>
    /// <response code="401">User is not authenticated.</response>
    /// <response code="403">User does not have host privileges.</response>
    /// <response code="409">A listing with this title already exists for this host.</response>
    /// <response code="500">Internal server error occurred during listing creation.</response>
    [HttpPost]
    [Authorize(Roles = "Host")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingRequestDto request)
    {
        // Implementation
        return CreatedAtAction(nameof(GetListing), new { id = 1 }, new ListingDto());
    }
}
```

---

## Checklist for Endpoint Documentation

Before submitting code, ensure each endpoint has:

- [ ] XML `<summary>` tag with clear one-line description
- [ ] XML `<remarks>` tag for complex endpoints (business rules, triggers, etc.)
- [ ] XML `<param>` tags for ALL parameters
- [ ] XML `<returns>` tag describing the return value
- [ ] XML `<response>` tags for ALL possible status codes
- [ ] `[ProducesResponseType]` attributes for ALL responses with correct types
- [ ] `[HttpGet/Post/Put/Delete]` attribute with route template
- [ ] Authorization attributes (`[Authorize]`, `[AllowAnonymous]`)
- [ ] Logging statements for debugging
- [ ] Related DTOs are fully documented

---

## Tools and Validation

### View Documentation
Access the Scalar documentation UI at: `http://localhost:5082/scalar/v1` (when running in Development mode)

### Build Warnings
The project is configured to generate XML documentation. Missing documentation will show as build warnings (suppressed for now with `<NoWarn>1591</NoWarn>`).

### Code Reviews
All pull requests will be reviewed for documentation completeness. PRs with inadequately documented endpoints will be rejected.

---

## Additional Resources

- [Scalar Documentation](https://github.com/scalar/scalar)
- [Swashbuckle Documentation](https://github.com/domaindrivendev/Swashbuckle.AspNetCore)
- [XML Documentation Comments (C#)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/xmldoc/)
- [ASP.NET Core Web API Documentation](https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-16 | Initial documentation standards created |

---

**Remember**: Good API documentation is as important as good code. When in doubt, over-document rather than under-document!
