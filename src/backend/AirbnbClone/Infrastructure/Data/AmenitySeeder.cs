using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data
{
    public static class AmenitySeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Set<Amenity>().AnyAsync()) return;

            var amenities = new List<Amenity>
            {
                // Essentials
                new Amenity { Name = "Wifi", Icon = "wifi", Category = "Essentials" },
                new Amenity { Name = "TV", Icon = "tv", Category = "Essentials" },
                new Amenity { Name = "Kitchen", Icon = "chef-hat", Category = "Essentials" },
                new Amenity { Name = "Washer", Icon = "washing-machine", Category = "Essentials" },
                new Amenity { Name = "Free parking on premises", Icon = "car", Category = "Essentials" },
                new Amenity { Name = "Paid parking on premises", Icon = "circle-dollar-sign", Category = "Essentials" },
                new Amenity { Name = "Air conditioning", Icon = "snowflake", Category = "Essentials" },
                new Amenity { Name = "Dedicated workspace", Icon = "monitor", Category = "Essentials" },

                // Safety
                new Amenity { Name = "Smoke alarm", Icon = "siren", Category = "Safety" },
                new Amenity { Name = "First aid kit", Icon = "briefcase-medical", Category = "Safety" },
                new Amenity { Name = "Fire extinguisher", Icon = "flame", Category = "Safety" },
                new Amenity { Name = "Carbon monoxide alarm", Icon = "wind", Category = "Safety" },
                
                // Standout
                new Amenity { Name = "Pool", Icon = "waves", Category = "Standout" },
                new Amenity { Name = "Hot tub", Icon = "bath", Category = "Standout" },
                new Amenity { Name = "Patio", Icon = "sun", Category = "Standout" },
                new Amenity { Name = "BBQ grill", Icon = "utensils", Category = "Standout" },
                new Amenity { Name = "Outdoor dining area", Icon = "tent", Category = "Standout" },
                new Amenity { Name = "Fire pit", Icon = "flame", Category = "Standout" },
                new Amenity { Name = "Pool table", Icon = "gamepad-2", Category = "Standout" },
                new Amenity { Name = "Indoor fireplace", Icon = "flame", Category = "Standout" },
                new Amenity { Name = "Piano", Icon = "music", Category = "Standout" }
            };

            await context.Set<Amenity>().AddRangeAsync(amenities);
            await context.SaveChangesAsync();
        }
    }
}