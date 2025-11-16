# Serilog Logging Configuration

## 📝 Overview

Serilog has been fully configured to log to **three destinations** simultaneously:
1. **Console** - Real-time logging during development
2. **File** - Rolling log files with retention
3. **Database** - SQL Server table for persistent log storage

---

## ✅ Installed Packages

```xml
<PackageReference Include="Serilog.AspNetCore" Version="9.0.0" />
<PackageReference Include="Serilog.Sinks.MSSqlServer" Version="8.0.0" />
<PackageReference Include="Serilog.Sinks.File" Version="6.0.0" />
<PackageReference Include="Serilog.Enrichers.Environment" Version="3.0.1" />
<PackageReference Include="Serilog.Enrichers.Thread" Version="4.0.0" />
```

---

## 📊 Logging Destinations

### 1. Console Logging
- **Format**: `[HH:mm:ss Level] Message {Properties}`
- **Purpose**: Real-time feedback during development
- **Example**: `[14:32:15 INF] HTTP GET /api/auth/login responded 200 in 125.3456 ms`

### 2. File Logging
- **Location**: `Logs/log-YYYYMMDD.txt`
- **Rolling**: Creates new file daily
- **Retention**: Keeps last 30 days
- **Size Limit**: 10 MB per file (rolls over on size)
- **Format**: `2025-11-16 14:32:15.456 +02:00 [INF] Message {Properties}`

### 3. Database Logging
- **Table**: `dbo.Logs` (auto-created by Serilog)
- **Level**: Information and above (Debug logs excluded)
- **Connection**: Uses the same connection string as the main database

#### Database Schema (Auto-Created)
```sql
CREATE TABLE [dbo].[Logs] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Message] NVARCHAR(MAX) NULL,
    [MessageTemplate] NVARCHAR(MAX) NULL,
    [Level] NVARCHAR(128) NULL,
    [TimeStamp] DATETIME NOT NULL,
    [Exception] NVARCHAR(MAX) NULL,
    [Properties] NVARCHAR(MAX) NULL,
    [LogEvent] NVARCHAR(MAX) NULL,
    
    -- Custom columns
    [User] NVARCHAR(256) NULL,           -- Username if authenticated
    [RequestPath] NVARCHAR(500) NULL     -- HTTP request path
)
```

---

## 🔍 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| **Verbose** | Detailed tracing information | `Executing query: SELECT * FROM Users WHERE Id = @p0` |
| **Debug** | Internal system events (dev only) | `Cache miss for key: user_123` |
| **Information** | General flow of application | `User 'john@example.com' logged in successfully` |
| **Warning** | Abnormal or unexpected events | `Password reset requested for non-existent email` |
| **Error** | Errors and exceptions | `Failed to send email to user@example.com` |
| **Fatal** | Critical errors causing shutdown | `Database connection failed - application shutting down` |

---

## 🚀 Usage Examples

### In Controllers (Using ILogger)
```csharp
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for user {Email}", request.Email);
        
        try
        {
            var result = await _authService.LoginAsync(request);
            _logger.LogInformation("User {Email} logged in successfully", request.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for user {Email}", request.Email);
            return BadRequest("Invalid credentials");
        }
    }
}
```

### Using LogHelper (Anywhere in Api Project)
```csharp
using Api.Helpers;

// Information
LogHelper.Information("User {UserId} updated profile", userId);

// Warning
LogHelper.Warning("Unusual activity detected from IP {IP}", ipAddress);

// Error with exception
try 
{
    // Some operation
}
catch (Exception ex)
{
    LogHelper.Error(ex, "Failed to process booking {BookingId}", bookingId);
}

// Error without exception
LogHelper.Error("Invalid payment status {Status} for booking {BookingId}", status, bookingId);

// Debug (development only)
LogHelper.Debug("Cache statistics: {CacheHits} hits, {CacheMisses} misses", hits, misses);

// Fatal
LogHelper.Fatal(ex, "Critical system failure - unable to connect to database");
```

### In Services (Application Layer)
```csharp
using Microsoft.Extensions.Logging;

public class AuthService : IAuthService
{
    private readonly ILogger<AuthService> _logger;

    public AuthService(ILogger<AuthService> logger)
    {
        _logger = logger;
    }

    public async Task<string> RegisterAsync(RegisterRequest request)
    {
        _logger.LogInformation("Registering new user with email {Email}", request.Email);
        
        // Registration logic...
        
        _logger.LogInformation("User {UserId} registered successfully", user.Id);
        return token;
    }
}
```

---

## 🎯 HTTP Request Logging

Every HTTP request is automatically logged with rich context:

```
HTTP POST /api/auth/login responded 200 in 125.3456 ms
Properties: {
    "RequestHost": "localhost:5000",
    "RequestScheme": "https",
    "RemoteIP": "::1",
    "UserAgent": "Mozilla/5.0...",
    "UserName": "john@example.com"  // If authenticated
}
```

### Enrichment Details
- **Machine Name** - Server/computer name
- **Thread ID** - Execution thread
- **Request Context** - HTTP method, path, status code, elapsed time
- **User Context** - Username if authenticated
- **Client Info** - IP address, user agent

---

## ⚙️ Configuration Files

### appsettings.json (Production)
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "System": "Warning"
      }
    }
  }
}
```

### appsettings.Development.json (Development)
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft": "Information",
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      }
    }
  }
}
```

---

## 📁 File Structure

```
Api/
├── Logs/                           ← Created automatically
│   ├── log-20251116.txt           ← Today's log
│   ├── log-20251115.txt
│   └── log-20251114.txt
├── Helpers/
│   └── LogHelper.cs               ← Logging helper class
└── Program.cs                      ← Serilog configuration
```

---

## 🔧 Customization

### Change Log File Location
In `Program.cs`, modify:
```csharp
.WriteTo.File(
    path: "C:/MyApp/Logs/log-.txt",  // Custom path
    rollingInterval: RollingInterval.Day
)
```

### Change Database Table Name
In `Program.cs`, modify:
```csharp
sinkOptions: new MSSqlServerSinkOptions
{
    TableName = "ApplicationLogs",  // Custom table name
    AutoCreateSqlTable = true
}
```

### Add Custom Properties to All Logs
In `Program.cs`, add enrichers:
```csharp
.Enrich.WithProperty("Application", "AirbnbClone")
.Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
```

### Log Specific HTTP Status Codes Only
In `Program.cs`, modify request logging:
```csharp
app.UseSerilogRequestLogging(options =>
{
    options.GetLevel = (httpContext, elapsed, ex) =>
    {
        if (ex != null) return LogEventLevel.Error;
        if (httpContext.Response.StatusCode >= 500) return LogEventLevel.Error;
        if (httpContext.Response.StatusCode >= 400) return LogEventLevel.Warning;
        return LogEventLevel.Information;
    };
});
```

---

## 🗄️ Querying Logs from Database

### Get all errors from today
```sql
SELECT * FROM Logs 
WHERE Level = 'Error' 
  AND CAST(TimeStamp AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY TimeStamp DESC
```

### Get failed login attempts
```sql
SELECT TimeStamp, Message, User, RequestPath 
FROM Logs 
WHERE Message LIKE '%login%failed%'
  AND TimeStamp >= DATEADD(HOUR, -24, GETDATE())
ORDER BY TimeStamp DESC
```

### Get logs for specific user
```sql
SELECT * FROM Logs 
WHERE User = 'john@example.com'
  AND TimeStamp >= DATEADD(DAY, -7, GETDATE())
ORDER BY TimeStamp DESC
```

### Get error statistics by endpoint
```sql
SELECT 
    RequestPath,
    COUNT(*) as ErrorCount,
    MIN(TimeStamp) as FirstError,
    MAX(TimeStamp) as LastError
FROM Logs 
WHERE Level = 'Error'
  AND RequestPath IS NOT NULL
GROUP BY RequestPath
ORDER BY ErrorCount DESC
```

---

## 📊 Log Monitoring Best Practices

1. **Information Level**: Log significant events (user actions, business operations)
2. **Warning Level**: Log recoverable errors or unusual behavior
3. **Error Level**: Log exceptions and failures that need attention
4. **Avoid Over-Logging**: Don't log inside tight loops or high-frequency operations
5. **Structured Logging**: Use named properties instead of string concatenation
   - ✅ `_logger.LogInformation("User {UserId} performed action", userId)`
   - ❌ `_logger.LogInformation($"User {userId} performed action")`
6. **Sensitive Data**: Never log passwords, tokens, or sensitive user data

---

## 🔐 Security Considerations

### Already Protected
- Passwords are NOT logged
- Connection strings use named references (not inline)
- User IDs are logged, but never passwords or tokens

### Additional Security
To exclude sensitive data from logs:
```csharp
// In your DTOs, use destructuring hints
public class LoginRequest
{
    public string Email { get; set; }
    
    [JsonIgnore] // Prevents accidental logging
    public string Password { get; set; }
}
```

---

## ✅ Testing Serilog

### Quick Test
Add this to any controller action:
```csharp
_logger.LogInformation("Test log - Information");
_logger.LogWarning("Test log - Warning");
_logger.LogError("Test log - Error");
```

### Verify Logs Are Working
1. **Console**: Check the console output when running the app
2. **File**: Check `Api/Logs/log-YYYYMMDD.txt`
3. **Database**: Query `SELECT TOP 10 * FROM Logs ORDER BY TimeStamp DESC`

---

## 🚀 Ready to Use!

Serilog is fully configured and ready to use throughout your application. Simply inject `ILogger<T>` into any class or use `LogHelper` for quick logging.

**No additional configuration needed!** 🎉
