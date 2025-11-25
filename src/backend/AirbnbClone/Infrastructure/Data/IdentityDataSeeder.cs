using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Infrastructure.Data
{
    public class IdentityDataSeeder
    {
        public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetRequiredService<ILogger<IdentityDataSeeder>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] roleNames = { "Guest", "Host", "SuperAdmin" };

            foreach (var roleName in roleNames)
            {
                var roleExists = await roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    // Create the role
                    var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                    if (result.Succeeded)
                    {
                        logger.LogInformation("Role '{RoleName}' created successfully.", roleName);
                    }
                    else
                    {
                        foreach (var error in result.Errors)
                        {
                            logger.LogError("Error creating role '{RoleName}': {Error}", roleName, error.Description);
                        }
                    }
                }
            }
        }
    }
}