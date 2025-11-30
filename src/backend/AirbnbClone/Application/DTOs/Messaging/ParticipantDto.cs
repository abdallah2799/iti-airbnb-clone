// File: Application/DTOs/Messaging/ParticipantDto.cs
namespace Application.DTOs.Messaging;

/// <summary>
/// DTO for conversation participant information
/// </summary>
public class ParticipantDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsOnline { get; set; } = false;
}

