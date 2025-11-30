using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Core.Entities;

namespace Core.Interfaces;

public interface IAmenityRepository : IRepository<Amenity>
{
    Task<IEnumerable<Amenity>> GetByCategoryAsync(string category);
}

