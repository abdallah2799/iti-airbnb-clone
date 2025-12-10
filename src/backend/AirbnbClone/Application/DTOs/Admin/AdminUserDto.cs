using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;

    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string[] Roles { get; set; } = Array.Empty<string>();

    public DateTime CreatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsConfirmed { get; set; }

    public bool IsSuspended { get; set; } 

    // Host-specific (nullable)
    public DateTime? HostSince { get; set; }
}

