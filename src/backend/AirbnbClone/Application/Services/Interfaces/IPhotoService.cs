using Microsoft.AspNetCore.Http;

namespace Application.Services.Interfaces
{
    public interface IPhotoService
    {
        Task<string> UploadPhotoAsync(IFormFile file);
    }
}