using System.Text;
using AirbnbClone.Api.BackgroundServices;
using Core.Interfaces;
using AirbnbClone.Infrastructure;
using AirbnbClone.Infrastructure.Services;
using AirbnbClone.Infrastructure.Services.Interfaces;
using AirbnbClone.Infrastructure.Services.Implementation;
using Api.Hubs;
using Application.Configuration;
using Application.Services.Implementation;
using Application.Services.Implementations;
using Application.Services.Interfaces;
using Core.Entities;
using Hangfire;
using Hangfire.SqlServer;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Implementation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qdrant.Client; // <--- 1. Added Namespace
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;

// ---------------------------------------------------------
// 1. BOOTSTRAP LOGGER CONFIGURATION
// ---------------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Airbnb Clone API");

    var builder = WebApplication.CreateBuilder(args);

    // ---------------------------------------------------------
    // 2. LOGGING SETUP (SERILOG)
    // ---------------------------------------------------------
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithThreadId()
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
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
                    new Serilog.Sinks.MSSqlServer.SqlColumn { ColumnName = "User", DataType = System.Data.SqlDbType.NVarChar, DataLength = 256, AllowNull = true },
                    new Serilog.Sinks.MSSqlServer.SqlColumn { ColumnName = "RequestPath", DataType = System.Data.SqlDbType.NVarChar, DataLength = 500, AllowNull = true }
                }
            }
        ));

    // ---------------------------------------------------------
    // 3. INFRASTRUCTURE & DATABASE
    // ---------------------------------------------------------
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // --- 2. ADDED QDRANT CLIENT REGISTRATION ---
   
    // Make sure your Qdrant Docker container is running on port 6334.
    builder.Services.AddSingleton<QdrantClient>(sp => 
        new QdrantClient("localhost", 6334)); 
    // -------------------------------------------

    builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));

    builder.Services.AddInfrastructure(builder.Configuration); // AI/Knowledge services
    builder.Services.AddHostedService<KnowledgeWatcher>();

    // ---------------------------------------------------------
    // 4. IDENTITY & AUTHENTICATION
    // ---------------------------------------------------------
    builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.User.RequireUniqueEmail = true;
        options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultProvider;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

    var jwtSettings = builder.Configuration.GetSection("Jwt");
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured")))
        };

        // SignalR Token Handling
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    })
    .AddGoogle("Google", options =>
    {
        var googleClientId = builder.Configuration["Google:ClientId"];
        var googleClientSecret = builder.Configuration["Google:ClientSecret"];

        if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.CallbackPath = "/api/auth/external-callback";
            options.Scope.Add("email");
            options.Scope.Add("profile");
            options.SaveTokens = true;
        }
    });

    // ---------------------------------------------------------
    // 5. BACKGROUND JOBS (HANGFIRE)
    // ---------------------------------------------------------
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"), new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true,
            PrepareSchemaIfNecessary = true
        }));

    builder.Services.AddHangfireServer(); // The Worker
    builder.Services.AddScoped<IBackgroundJobService, HangfireJobService>(); // The Abstraction

    // ---------------------------------------------------------
    // 6. APPLICATION SERVICES (DI CONTAINER)
    // ---------------------------------------------------------
    // Unit of Work & Repositories
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
    builder.Services.AddScoped<IMessageRepository, MessageRepository>();
    builder.Services.AddScoped<IListingRepository, ListingRepository>();
    builder.Services.AddScoped<IBookingRepository, BookingRepository>();
    builder.Services.AddScoped<IAmenityRepository, AmenityRepository>();
    builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
    builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
    builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();

    // Domain Services
    builder.Services.AddScoped<IPhotoService, PhotoService>();
    builder.Services.AddScoped<IHostListingService, HostListingService>();
    builder.Services.AddScoped<IHostBookingService, HostBookingService>();
    builder.Services.AddScoped<IListingService, ListingService>();
    builder.Services.AddScoped<IReviewService, ReviewService>();
    builder.Services.AddScoped<IUserProfileService, UserProfileService>();
    builder.Services.AddScoped<IWishlistService, WishlistService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IBookingService, BookingService>();
    builder.Services.AddScoped<IMessagingService, MessagingService>();
    // Register HttpClient for N8n Service
    builder.Services.AddHttpClient<IN8nIntegrationService, N8nIntegrationService>();

    // AutoMapper
    builder.Services.AddAutoMapper(
        typeof(AirbnbClone.Application.Helpers.UserMappingProfile),
        typeof(AirbnbClone.Application.Helpers.ListingMappingProfile),
        typeof(AirbnbClone.Application.Helpers.HostListingMappingProfile),
        typeof(AirbnbClone.Application.Helpers.MessagingMappingProfile),
        typeof(AirbnbClone.Application.Helpers.PhotoAmenityReviewMappingProfile),
        typeof(AirbnbClone.Application.Helpers.BookingMappingProfile),
        typeof(AirbnbClone.Application.Helpers.AdminMappingProfile)
    );

    // ---------------------------------------------------------
    // 7. API CONFIGURATION (CORS, SIGNALR, SWAGGER)
    // ---------------------------------------------------------
    builder.Services.AddSignalR();
    builder.Services.AddControllers();

    var frontendUrl = builder.Configuration["ApplicationUrls:FrontendUrl"] ?? "http://localhost:4200";
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins(
                    frontendUrl,
                    "http://localhost:8080",
                    "http://localhost:5082",
                    "https://localhost:7088",
                    "https://localhost:5500"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .WithExposedHeaders("Content-Disposition");
        });
    });

    // OpenAPI / Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "Airbnb Clone API",
            Version = "v1.0.0",
            Description = "A comprehensive RESTful API for the Airbnb Clone application.",
            Contact = new() { Name = "Airbnb Clone Team", Email = "support@airbnbclone.com" }
        });

        var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }
    });

    var app = builder.Build();

    // ---------------------------------------------------------
    // 8. MIDDLEWARE PIPELINE
    // ---------------------------------------------------------

    // Configure Stripe
    var stripeSection = app.Configuration.GetSection("Stripe");
    Stripe.StripeConfiguration.ApiKey = stripeSection["SecretKey"];

    // Data Seeding
    try
    {
        Log.Information("Attempting to seed roles...");
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            var context = services.GetRequiredService<ApplicationDbContext>();
            await IdentityDataSeeder.SeedRolesAsync(services);
            await AmenitySeeder.SeedAsync(context);
        }
        Log.Information("Role seeding complete.");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while seeding roles.");
    }

    // Logging Middleware
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                diagnosticContext.Set("UserName", httpContext.User.Identity.Name);
            }
        };
    });

    // Development Tools
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.MapScalarApiReference(options =>
        {
            options
                .WithTitle("Airbnb Clone API Documentation")
                .WithTheme(ScalarTheme.Purple)
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
                .WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json");
        });
        Log.Information("Scalar API Documentation available at: /scalar/v1");
    }

    // Standard Pipeline
    app.UseHttpsRedirection();
    app.UseCors("AllowAngularApp");

    app.UseAuthentication();
    app.UseAuthorization();

    // Background Jobs Dashboard
    app.UseHangfireDashboard("/hangfire"); // Access at http://localhost:port/hangfire

    // Endpoints
    app.MapControllers();
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
