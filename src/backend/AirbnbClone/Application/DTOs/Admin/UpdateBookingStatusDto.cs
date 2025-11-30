using Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class UpdateBookingStatusDto
{
    [Required]
    public BookingStatus Status { get; set; }
}

