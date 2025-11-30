using System.ComponentModel.DataAnnotations;

public class RefreshTokenDto
{
    [Required]
    public string Token { get; set; } // The EXPIRED Access Token

    [Required]
    public string RefreshToken { get; set; } // The Hex String from the DB
}

