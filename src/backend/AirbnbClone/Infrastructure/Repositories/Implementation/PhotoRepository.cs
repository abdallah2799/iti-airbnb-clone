using Core.Entities;
using Infrastructure.Data;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repositories.Implementation
{
    public class PhotoRepository : Repository<Photo>, IPhotoRepository
    {
        public PhotoRepository(ApplicationDbContext context) : base(context)
        {
        }
        public async Task<IEnumerable<Photo>> GetPhotosForListingAsync(int listingId)
        {
            return await _context.Photos
                .Where(p => p.ListingId == listingId)
                .OrderBy(p => p.Id) // Order them by ID
                .ToListAsync();
        }
    }
}
