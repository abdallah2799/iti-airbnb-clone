using Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repositories.Interfaces
{
    public interface IPhotoRepository : IRepository<Photo>
    {
        // We can add photo-specific methods here later
        Task<IEnumerable<Photo>> GetPhotosForListingAsync(int listingId);
    }
}
