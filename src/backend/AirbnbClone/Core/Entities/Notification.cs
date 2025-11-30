namespace Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime Timestamp { get; set; }
    public string? LinkUrl { get; set; }

    // Foreign Keys
    public string UserId { get; set; } = string.Empty;

    // Navigation Properties
    public ApplicationUser User { get; set; } = null!;
}

