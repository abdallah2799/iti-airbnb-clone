using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

/// <summary>
/// DTO for changing password when logged in (Sprint 0)
/// </summary>
public class ChangePasswordDto
{
    // Not required for Google users setting password for first time
    public string? CurrentPassword { get; set; }

    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", 
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number")]
    public string NewPassword { get; set; } = string.Empty;

    [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}


