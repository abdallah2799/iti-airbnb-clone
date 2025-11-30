namespace Core.Entities;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }

    // Foreign Keys
    public int ConversationId { get; set; }
    public string SenderId { get; set; } = string.Empty;

    // Navigation Properties
    public Conversation Conversation { get; set; } = null!;
    public ApplicationUser Sender { get; set; } = null!;
}

