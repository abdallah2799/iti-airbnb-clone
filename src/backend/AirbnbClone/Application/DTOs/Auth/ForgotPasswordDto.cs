using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

/// <summary>
/// DTO for forgot password request (Sprint 0)
/// </summary>
public class ForgotPasswordDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;
}


