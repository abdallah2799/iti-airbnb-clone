using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ResendConfirmationEmailDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
