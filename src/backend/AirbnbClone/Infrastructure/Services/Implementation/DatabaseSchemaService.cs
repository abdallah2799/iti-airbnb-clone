using Core.Interfaces;

namespace Infrastructure.Services.Implementation
{
    public class DatabaseSchemaService : IDatabaseSchemaService
    {
        public string GetSchemaForAi()
        {
            // A simplified map of your actual database tables
            return @"
                -- DATABASE SCHEMA (READ-ONLY) --
                
                TABLE [Users] (
                    [Id] NVARCHAR(450),
                    [FullName] NVARCHAR,
                    [Email] NVARCHAR,
                    [City] NVARCHAR,
                    [Country] NVARCHAR,
                    [IsSuperHost] BIT,
                    [HostResponseRate] DECIMAL,
                    [CreatedAt] DATETIME2
                );

                TABLE [Listings] (
                    [Id] INT,
                    [Title] NVARCHAR,
                    [Description] NVARCHAR,
                    [PricePerNight] DECIMAL,
                    [City] NVARCHAR,
                    [Country] NVARCHAR,
                    [MaxGuests] INT,
                    [HostId] NVARCHAR(450) (Links to Users.Id),
                    [PropertyType] INT,
                    [Status] INT (0=Active, 1=Unlisted)
                );

                TABLE [Bookings] (
                    [Id] INT,
                    [ListingId] INT (Links to Listings.Id),
                    [GuestId] NVARCHAR(450) (Links to Users.Id),
                    [StartDate] DATETIME2,
                    [EndDate] DATETIME2,
                    [TotalPrice] DECIMAL,
                    [Status] INT (0=Pending, 1=Confirmed, 2=Completed, 3=Cancelled)
                );

                TABLE [Reviews] (
                    [Id] INT,
                    [Rating] INT,
                    [Comment] NVARCHAR,
                    [ListingId] INT,
                    [GuestId] NVARCHAR(450)
                );
            ";
        }
    }
}