using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Implementation;

public class AmenityRepository : Repository<Amenity>, IAmenityRepository
{
    public AmenityRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Amenity>> GetByCategoryAsync(string category)
    {
        return await _dbSet
            .Where(a => a.Category == category)
            .ToListAsync();
    }
}