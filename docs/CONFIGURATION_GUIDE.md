# Configuration Guide

This document explains how to configure and manage key application settings including CORS, JWT Authentication, SendGrid Email Service, and Google OAuth.

---

## Table of Contents
1. [CORS Configuration](#cors-configuration)
2. [JWT Authentication](#jwt-authentication)
3. [SendGrid Email Service](#sendgrid-email-service)
4. [Google OAuth](#google-oauth)
5. [Application URLs](#application-urls)

---

## CORS Configuration

### What is CORS?
Cross-Origin Resource Sharing (CORS) allows your Angular frontend (running on `http://localhost:4200`) to communicate with your .NET backend API (running on `https://localhost:7001`).

### Current Configuration

**Location:** `src/backend/AirbnbClone/Api/Program.cs` (Lines 168-183)

```csharp
// Add CORS for Angular frontend
var frontendUrl = builder.Configuration["ApplicationUrls:FrontendUrl"] ?? "http://localhost:4200";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(frontendUrl) // Angular dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials() // Required for SignalR
              .WithExposedHeaders("Content-Disposition"); // For file downloads
    });
});

Log.Information("CORS configured for frontend URL: {FrontendUrl}", frontendUrl);
```

**Middleware Registration:** `Program.cs` (Line ~310)
```csharp
app.UseCors("AllowAngularApp");
```

### How to Update CORS

#### 1. Add Multiple Origins (Production + Development)

```csharp
var allowedOrigins = builder.Configuration.GetSection("ApplicationUrls:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(allowedOrigins) // Multiple origins
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition");
    });
});
```

**Update `appsettings.json`:**
```json
{
  "ApplicationUrls": {
    "AllowedOrigins": [
      "http://localhost:4200",
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ]
  }
}
```

#### 2. Restrict Specific Headers (More Secure)

```csharp
policy.WithOrigins(frontendUrl)
      .WithHeaders("Authorization", "Content-Type", "Accept")
      .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
      .AllowCredentials()
      .WithExposedHeaders("Content-Disposition");
```

#### 3. Add Custom Headers for File Uploads

```csharp
policy.WithOrigins(frontendUrl)
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials()
      .WithExposedHeaders("Content-Disposition", "X-Total-Count", "X-Pagination");
```

### CORS Troubleshooting

| Issue | Solution |
|-------|----------|
| **"CORS policy blocked"** | Ensure `UseCors()` is called BEFORE `UseAuthorization()` |
| **Credentials not sent** | Verify `.AllowCredentials()` is set |
| **SignalR connection fails** | Must have `.AllowCredentials()` enabled |
| **File download issues** | Add `.WithExposedHeaders("Content-Disposition")` |

---

## JWT Authentication

### What is JWT?
JSON Web Tokens (JWT) are used for stateless authentication. When a user logs in, they receive a token that must be included in subsequent API requests.

### Current Configuration

**Location:** `appsettings.json` / `appsettings.Development.json`

```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForProduction",
    "Issuer": "AirbnbCloneApi",
    "Audience": "AirbnbCloneClient",
    "ExpiryInMinutes": 1440
  }
}
```

**Program.cs Configuration:** (Currently commented - needs to be uncommented for Sprint 0)

```csharp
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] 
                ?? throw new InvalidOperationException("JWT Key not configured")))
    };
    
    // Enable JWT authentication for SignalR (Sprint 3)
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
});
```

### How to Update JWT

#### 1. Change Token Expiration Time

**For Development (24 hours):**
```json
"ExpiryInMinutes": 1440
```

**For Production (15 minutes with refresh tokens):**
```json
"ExpiryInMinutes": 15
```

#### 2. Use User Secrets for Production Keys

**Never commit production JWT keys to Git!**

```powershell
cd src/backend/AirbnbClone/Api
dotnet user-secrets set "Jwt:Key" "YourProductionSecretKeyHere"
```

#### 3. Add Refresh Token Configuration

```json
{
  "Jwt": {
    "Key": "...",
    "Issuer": "AirbnbCloneApi",
    "Audience": "AirbnbCloneClient",
    "AccessTokenExpiryInMinutes": 15,
    "RefreshTokenExpiryInDays": 7
  }
}
```

#### 4. Generate Secure Random Key

**PowerShell:**
```powershell
# Generate 64-character key
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**C# (in code):**
```csharp
var keyBytes = new byte[32];
using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
rng.GetBytes(keyBytes);
var key = Convert.ToBase64String(keyBytes);
```

### JWT Security Best Practices

✅ **DO:**
- Use at least 32-character keys
- Store production keys in User Secrets or Azure Key Vault
- Set short expiration times (15-60 minutes) with refresh tokens
- Validate Issuer, Audience, and Lifetime

❌ **DON'T:**
- Commit JWT keys to Git
- Use simple/predictable keys
- Store sensitive data in JWT payload
- Use long expiration times without refresh tokens

---

## SendGrid Email Service

### What is SendGrid?
SendGrid is a cloud-based email delivery service used for sending transactional emails (registration confirmations, password resets, booking notifications).

### Current Configuration

**Location:** `appsettings.json` / `appsettings.Development.json`

```json
{
  "SendGrid": {
    "ApiKey": "YOUR_SENDGRID_API_KEY_HERE",
    "FromEmail": "noreply@airbnbclone.com",
    "FromName": "Airbnb Clone"
  }
}
```

### How to Set Up SendGrid

#### 1. Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free tier (100 emails/day)
3. Verify your email address

#### 2. Create API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `AirbnbClone-Development`
4. Permissions: **Full Access** (or **Mail Send** only for production)
5. Copy the generated API key

#### 3. Configure API Key

**Option A: appsettings.Development.json (for development only)**
```json
{
  "SendGrid": {
    "ApiKey": "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "FromEmail": "dev@airbnbclone.local",
    "FromName": "Airbnb Clone [DEV]"
  }
}
```

**Option B: User Secrets (recommended)**
```powershell
cd src/backend/AirbnbClone/Api
dotnet user-secrets set "SendGrid:ApiKey" "SG.xxxxxxxxx"
```

#### 4. Verify Sender Identity (Required for Production)

1. Go to **Settings** → **Sender Authentication**
2. **Single Sender Verification** (easiest for development):
   - Add your email address
   - SendGrid will send verification email
3. **Domain Authentication** (required for production):
   - Add DNS records to your domain
   - Improves deliverability and removes "via sendgrid.net"

### SendGrid Email Templates

**Example: Password Reset Email**

```csharp
public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
{
    var client = new SendGridClient(_configuration["SendGrid:ApiKey"]);
    var resetUrl = $"{_configuration["ApplicationUrls:PasswordResetUrl"]}?token={resetToken}";
    
    var msg = new SendGridMessage()
    {
        From = new EmailAddress(
            _configuration["SendGrid:FromEmail"], 
            _configuration["SendGrid:FromName"]),
        Subject = "Reset Your Password",
        PlainTextContent = $"Click here to reset your password: {resetUrl}",
        HtmlContent = $@"
            <h2>Reset Your Password</h2>
            <p>Click the button below to reset your password:</p>
            <a href='{resetUrl}' style='background-color: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;'>
                Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
        "
    };
    msg.AddTo(new EmailAddress(toEmail));
    
    await client.SendEmailAsync(msg);
}
```

### SendGrid Troubleshooting

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Check API key is correct and has permissions |
| **403 Forbidden** | Verify sender email address in SendGrid |
| **Emails going to spam** | Set up domain authentication (SPF/DKIM) |
| **Rate limit exceeded** | Upgrade SendGrid plan or implement email queuing |

---

## Google OAuth

### What is Google OAuth?
Allows users to sign in using their Google account instead of creating a new password.

### Current Configuration

**Location:** `appsettings.json` / `appsettings.Development.json`

```json
{
  "Google": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID_HERE",
    "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET_HERE"
  }
}
```

### How to Set Up Google OAuth

#### 1. Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Project name: `Airbnb Clone`
4. Click **Create**

#### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for **Google+ API**
3. Click **Enable**

#### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure **OAuth consent screen**:
   - User Type: **External**
   - App name: `Airbnb Clone`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid`
4. Application type: **Web application**
5. Name: `Airbnb Clone Web Client`
6. **Authorized redirect URIs:**
   - Development: `https://localhost:7001/signin-google`
   - Production: `https://yourdomain.com/signin-google`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

#### 4. Configure in Application

**Option A: appsettings.Development.json**
```json
{
  "Google": {
    "ClientId": "123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com",
    "ClientSecret": "GOCSPX-xxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**Option B: User Secrets (recommended)**
```powershell
cd src/backend/AirbnbClone/Api
dotnet user-secrets set "Google:ClientId" "123456789-xxxxx.apps.googleusercontent.com"
dotnet user-secrets set "Google:ClientSecret" "GOCSPX-xxxxxx"
```

#### 5. Uncomment Google Auth in Program.cs

**Location:** `Program.cs` (Lines ~138-143)

```csharp
builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"] 
            ?? throw new InvalidOperationException("Google ClientId not configured");
        options.ClientSecret = builder.Configuration["Google:ClientSecret"] 
            ?? throw new InvalidOperationException("Google ClientSecret not configured");
    });
```

### Google OAuth Implementation

**Backend Controller:**
```csharp
[HttpGet("google-login")]
public IActionResult GoogleLogin()
{
    var properties = new AuthenticationProperties 
    { 
        RedirectUri = Url.Action("GoogleResponse") 
    };
    return Challenge(properties, GoogleDefaults.AuthenticationScheme);
}

[HttpGet("google-response")]
public async Task<IActionResult> GoogleResponse()
{
    var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    
    var claims = result.Principal.Identities.FirstOrDefault()?.Claims;
    var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
    var name = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
    
    // Create or find user, generate JWT token
    var user = await _authService.FindOrCreateGoogleUserAsync(email, name);
    var token = _authService.GenerateJwtToken(user);
    
    return Ok(new { token });
}
```

**Frontend (Angular):**
```typescript
googleLogin(): void {
  // Open popup or redirect
  window.location.href = 'https://localhost:7001/api/auth/google-login';
}
```

### Google OAuth Troubleshooting

| Issue | Solution |
|-------|----------|
| **redirect_uri_mismatch** | Add exact URL to Authorized redirect URIs in Google Console |
| **invalid_client** | Check ClientId and ClientSecret are correct |
| **access_denied** | User cancelled or consent screen not configured |
| **Consent screen not available** | Complete OAuth consent screen setup |

---

## Application URLs

### Current Configuration

**Location:** `appsettings.json` / `appsettings.Development.json`

```json
{
  "ApplicationUrls": {
    "FrontendUrl": "http://localhost:4200",
    "ApiUrl": "https://localhost:7001",
    "PasswordResetUrl": "http://localhost:4200/auth/reset-password"
  }
}
```

### How to Update for Production

**appsettings.Production.json:**
```json
{
  "ApplicationUrls": {
    "FrontendUrl": "https://www.yourdomain.com",
    "ApiUrl": "https://api.yourdomain.com",
    "PasswordResetUrl": "https://www.yourdomain.com/auth/reset-password"
  }
}
```

### Usage in Code

```csharp
// Get URLs from configuration
var frontendUrl = _configuration["ApplicationUrls:FrontendUrl"];
var resetUrl = $"{_configuration["ApplicationUrls:PasswordResetUrl"]}?token={token}";

// Use in CORS
policy.WithOrigins(frontendUrl);

// Use in emails
var emailBody = $"Click here: {resetUrl}";
```

---

## Environment-Specific Configuration

### Development
- Use `appsettings.Development.json`
- Can commit to Git (no sensitive data)
- Use User Secrets for API keys

### Production
- Use `appsettings.Production.json`
- **NEVER commit to Git**
- Use Azure Key Vault or environment variables

### User Secrets (Recommended for Local Development)

```powershell
cd src/backend/AirbnbClone/Api

# Initialize user secrets
dotnet user-secrets init

# Set values
dotnet user-secrets set "Jwt:Key" "your-secret-key"
dotnet user-secrets set "SendGrid:ApiKey" "SG.xxxxxx"
dotnet user-secrets set "Google:ClientId" "xxxxx.apps.googleusercontent.com"
dotnet user-secrets set "Google:ClientSecret" "GOCSPX-xxxxxx"

# List all secrets
dotnet user-secrets list

# Remove a secret
dotnet user-secrets remove "Jwt:Key"

# Clear all secrets
dotnet user-secrets clear
```

**Location:** Stored in:
- Windows: `%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json`
- macOS/Linux: `~/.microsoft/usersecrets/<user_secrets_id>/secrets.json`

---

## Quick Configuration Checklist

### Before Starting Sprint 0:

- [ ] **JWT Configuration**
  - [ ] Set `Jwt:Key` (32+ characters)
  - [ ] Configure `Jwt:Issuer` and `Jwt:Audience`
  - [ ] Uncomment JWT configuration in `Program.cs`

- [ ] **SendGrid Configuration**
  - [ ] Create SendGrid account
  - [ ] Generate API key
  - [ ] Set `SendGrid:ApiKey` in User Secrets
  - [ ] Verify sender email address

- [ ] **Google OAuth Configuration**
  - [ ] Create Google Cloud project
  - [ ] Generate OAuth credentials
  - [ ] Set `Google:ClientId` and `Google:ClientSecret`
  - [ ] Uncomment Google auth in `Program.cs`

- [ ] **CORS Configuration**
  - [ ] Verify `ApplicationUrls:FrontendUrl` is correct
  - [ ] Test CORS with Angular frontend
  - [ ] Ensure `UseCors()` is before `UseAuthorization()`

- [ ] **Database Configuration**
  - [ ] Verify connection string
  - [ ] Run `dotnet ef database update`
  - [ ] Test database connectivity

---

## Additional Resources

- [ASP.NET Core CORS Documentation](https://learn.microsoft.com/en-us/aspnet/core/security/cors)
- [JWT Bearer Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Sprint:** 0 (Authentication & Authorization)
