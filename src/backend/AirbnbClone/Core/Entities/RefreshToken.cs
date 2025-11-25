using System.ComponentModel.DataAnnotations.Schema;
using Core.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public string UserId { get; set; } // Linked to the User
    public string Token { get; set; } // The unique random string
    public string JwtId { get; set; } // The ID of the Access Token this is paired with
    public bool IsUsed { get; set; } // Usage flag for Rotation
    public bool IsRevoked { get; set; } // For manual revocation (Logout)
    public DateTime AddedDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    
    [ForeignKey(nameof(UserId))]
    public ApplicationUser User { get; set; }
}