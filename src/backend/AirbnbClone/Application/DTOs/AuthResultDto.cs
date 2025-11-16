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
}
