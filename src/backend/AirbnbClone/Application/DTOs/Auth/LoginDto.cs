using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

/// <summary>
/// DTO for user login with email (Sprint 0)
/// </summary>
public class LoginDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}


