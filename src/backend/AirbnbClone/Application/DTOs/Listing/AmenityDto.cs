// File: Application/DTOs/Listing/AmenityDto.cs
namespace Application.DTOs.Listing;

public class AmenityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Category { get; set; } = string.Empty;
}

