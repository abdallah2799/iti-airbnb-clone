using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

/// <summary>
/// DTO for Google OAuth authentication (Sprint 0)
/// </summary>
public class GoogleAuthDto
{
    [Required(ErrorMessage = "Google token is required")]
    public string GoogleToken { get; set; } = string.Empty;
}


