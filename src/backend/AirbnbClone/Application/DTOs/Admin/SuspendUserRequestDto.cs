using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Admin;

public class SuspendUserRequestDto
{
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    public string? Reason { get; set; }
}

