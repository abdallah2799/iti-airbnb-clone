namespace Application.DTOs;

/// <summary>
/// DTO for authentication result (Sprint 0)
/// </summary>
public class AuthResultDto
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public string? Message { get; set; }
    public UserDto? User { get; set; }
    public List<string> Errors { get; set; } = new();
    public string? RefreshToken { get; set; }
    public bool? EmailSent { get; set; } // Tracks if confirmation email was sent successfully
    public string? ErrorCode { get; set; } // Specific error code for frontend logic (e.g., "AUTH_SUSPENDED")
}


