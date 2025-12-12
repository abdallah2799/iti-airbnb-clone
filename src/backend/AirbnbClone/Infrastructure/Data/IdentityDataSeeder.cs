using Core.Entities;
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

            string[] roleNames = { "Guest", "Host", "Admin", "SuperAdmin" };

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

        public static async Task SeedSuperAdminUserAsync(IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetRequiredService<ILogger<IdentityDataSeeder>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            const string superAdminEmail = "SuperAdmin@Airbnb.com";
            const string superAdminPassword = "SuperAdmin@123";
            const string superAdminFullName = "Super Administrator";

            // Check if SuperAdmin user already exists
            var existingUser = await userManager.FindByEmailAsync(superAdminEmail);
            if (existingUser != null)
            {
                logger.LogInformation("SuperAdmin user already exists.");
                return;
            }

            // Create SuperAdmin user
            var superAdminUser = new ApplicationUser
            {
                UserName = superAdminEmail,
                Email = superAdminEmail,
                EmailConfirmed = true, // Auto-confirm email
                FullName = superAdminFullName,
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(superAdminUser, superAdminPassword);
            if (createResult.Succeeded)
            {
                // Assign SuperAdmin role
                var roleResult = await userManager.AddToRoleAsync(superAdminUser, "SuperAdmin");
                if (roleResult.Succeeded)
                {
                    logger.LogInformation("SuperAdmin user created successfully with email: {Email}", superAdminEmail);
                }
                else
                {
                    logger.LogError("Failed to assign SuperAdmin role to user {Email}", superAdminEmail);
                    foreach (var error in roleResult.Errors)
                    {
                        logger.LogError("Role assignment error: {Error}", error.Description);
                    }
                }
            }
            else
            {
                logger.LogError("Failed to create SuperAdmin user with email: {Email}", superAdminEmail);
                foreach (var error in createResult.Errors)
                {
                    logger.LogError("User creation error: {Error}", error.Description);
                }
            }
        }
    }
}