using Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class UpdateListingStatusDto
{
    [Required]
    public ListingStatus Status { get; set; }
}