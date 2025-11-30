// File: Application/DTOs/Listing/PhotoDto.cs
namespace Application.DTOs.Listing;

public class PhotoguestDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsCover { get; set; }
}

