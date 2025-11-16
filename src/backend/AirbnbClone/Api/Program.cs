using Api.Hubs;
using Application.Services.Interfaces;
using Core.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System.Text;

// Configure Serilog early in the application startup
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger(); // Bootstrap logger for early initialization

try
{
    Log.Information("Starting Airbnb Clone API");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog - Replace default logging with Serilog
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithThreadId()
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.File(
            path: "Logs/log-.txt",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            fileSizeLimitBytes: 10485760,
            rollOnFileSizeLimit: true,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.MSSqlServer(
            connectionString: context.Configuration.GetConnectionString("DefaultConnection"),
            sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
            {
                TableName = "Logs",
                AutoCreateSqlTable = true,
                SchemaName = "dbo"
            },
            restrictedToMinimumLevel: LogEventLevel.Information,
            columnOptions: new Serilog.Sinks.MSSqlServer.ColumnOptions
            {
                AdditionalColumns = new System.Collections.ObjectModel.Collection<Serilog.Sinks.MSSqlServer.SqlColumn>
                {
                    new Serilog.Sinks.MSSqlServer.SqlColumn
                    {
                        ColumnName = "User",
                        DataType = System.Data.SqlDbType.NVarChar,
                        DataLength = 256,
                        AllowNull = true
                    },
                    new Serilog.Sinks.MSSqlServer.SqlColumn
                    {
                        ColumnName = "RequestPath",
                        DataType = System.Data.SqlDbType.NVarChar,
                        DataLength = 500,
                        AllowNull = true
                    }
                }
            }
        ));

    // Add services to the container.

    // Configure Database
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Configure Identity
    builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        // Password settings
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;

        // User settings
        options.User.RequireUniqueEmail = true;
        
        // Sprint 0 - Token lifespan for password reset
        options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultProvider;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

    // TODO: Sprint 0 - Configure JWT Authentication
    // builder.Services.AddAuthentication(options =>
    // {
    //     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    //     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    // })
    // .AddJwtBearer(options =>
    // {
    //     options.TokenValidationParameters = new TokenValidationParameters
    //     {
    //         ValidateIssuer = true,
    //         ValidateAudience = true,
    //         ValidateLifetime = true,
    //         ValidateIssuerSigningKey = true,
    //         ValidIssuer = builder.Configuration["Jwt:Issuer"],
    //         ValidAudience = builder.Configuration["Jwt:Audience"],
    //         IssuerSigningKey = new SymmetricSecurityKey(
    //             Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured")))
    //     };
    //     
    //     // Sprint 3 - Enable JWT authentication for SignalR
    //     options.Events = new JwtBearerEvents
    //     {
    //         OnMessageReceived = context =>
    //         {
    //             var accessToken = context.Request.Query["access_token"];
    //             var path = context.HttpContext.Request.Path;
    //             if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
    //             {
    //                 context.Token = accessToken;
    //             }
    //             return Task.CompletedTask;
    //         }
    //     };
    // });

    // TODO: Sprint 0 - Configure Google Authentication
    // builder.Services.AddAuthentication()
    //     .AddGoogle(options =>
    //     {
    //         options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured");
    //         options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret not configured");
    //     });

    // Sprint 0 - Register Repository Pattern (Unit of Work)
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

    // Sprint 0 - Register Individual Repositories (if needed for direct access)
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
    builder.Services.AddScoped<IMessageRepository, MessageRepository>();
    builder.Services.AddScoped<IListingRepository, ListingRepository>();
    builder.Services.AddScoped<IBookingRepository, BookingRepository>();

    // TODO: Sprint 0 - Register Application Services
    // These need to be implemented in Application layer
    // builder.Services.AddScoped<IAuthService, AuthService>();
    // builder.Services.AddScoped<IEmailService, EmailService>();
    // builder.Services.AddScoped<IPaymentService, PaymentService>();
    // builder.Services.AddScoped<IMessagingService, MessagingService>();

    // Sprint 3 - Add SignalR for real-time messaging
    builder.Services.AddSignalR();

    // Add CORS for Angular frontend
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins("http://localhost:4200") // Angular dev server
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Required for SignalR
        });
    });

    builder.Services.AddControllers();
    // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
    builder.Services.AddOpenApi();

    var app = builder.Build();

    // Serilog - Add request logging middleware
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
            
            // Add user information if authenticated
            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                diagnosticContext.Set("UserName", httpContext.User.Identity.Name ?? "Unknown");
            }
        };
    });

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseHttpsRedirection();

    // Enable CORS
    app.UseCors("AllowAngularApp");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Sprint 3 - Map SignalR Hub
    app.MapHub<ChatHub>("/hubs/chat");

    Log.Information("Airbnb Clone API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
