# Quick Reference: Backend Architecture

## 📦 NuGet Packages by Project

### Api Project
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.Google" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="1.1.0" />
```

### Application Project
```xml
<PackageReference Include="SendGrid" Version="9.29.3" />
<PackageReference Include="Stripe.net" Version="46.4.0" />
```

### Infrastructure Project
```xml
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />
```

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────┐
│         Api (Presentation)          │
│  Controllers, Hubs, Middleware      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Application (Business)         │
│  Services, DTOs, Interfaces         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    Infrastructure (Data Access)     │
│  Repositories, DbContext, EF Core   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Core (Domain)               │
│    Entities, Enums, Interfaces      │
└─────────────────────────────────────┘
```

---

## 🗂️ Repository Pattern Structure

### Generic Repository
```csharp
IRepository<T>              // Interface with common CRUD operations
    └── Repository<T>       // Base implementation
```

### Specific Repositories (All Implemented)
```csharp
IUserRepository             // User-specific operations
    └── UserRepository
    
IConversationRepository     // Conversation-specific operations
    └── ConversationRepository
    
IMessageRepository          // Message-specific operations
    └── MessageRepository
    
IListingRepository          // Listing-specific operations
    └── ListingRepository
    
IBookingRepository          // Booking-specific operations
    └── BookingRepository
```

### Unit of Work
```csharp
IUnitOfWork                 // Manages transactions across repositories
    └── UnitOfWork
        ├── Users (IUserRepository)
        ├── Conversations (IConversationRepository)
        ├── Messages (IMessageRepository)
        ├── Listings (IListingRepository)
        └── Bookings (IBookingRepository)
```

---

## 🔌 Dependency Injection (Program.cs)

### Already Registered ✅
```csharp
// Repositories (Unit of Work Pattern)
services.AddScoped<IUnitOfWork, UnitOfWork>();
services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IConversationRepository, ConversationRepository>();
services.AddScoped<IMessageRepository, MessageRepository>();
services.AddScoped<IListingRepository, ListingRepository>();
services.AddScoped<IBookingRepository, BookingRepository>();

// SignalR
services.AddSignalR();

// CORS
services.AddCors("AllowAngularApp");
```

### Need to Implement & Register 🔶
```csharp
// Application Services (Create implementations first)
services.AddScoped<IAuthService, AuthService>();
services.AddScoped<IEmailService, EmailService>();
services.AddScoped<IPaymentService, PaymentService>();
services.AddScoped<IMessagingService, MessagingService>();

// JWT Authentication (Uncomment in Program.cs)
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(/* options */);

// Google OAuth (Uncomment in Program.cs)
services.AddAuthentication()
    .AddGoogle(/* options */);
```

---

## 🛣️ API Endpoints

### Authentication (AuthController)
```
POST   /api/auth/register              Register with Email
POST   /api/auth/register/google       Register with Google
POST   /api/auth/login                 Login with Email
POST   /api/auth/login/google          Login with Google
POST   /api/auth/forgot-password       Request Password Reset
POST   /api/auth/reset-password        Reset Password with Token
POST   /api/auth/change-password       Change Password (Authenticated)
GET    /api/auth/validate              Validate JWT Token
GET    /api/auth/external-callback     Google OAuth Callback
```

### Conversations (ConversationsController)
```
POST   /api/conversations                              Create/Get Conversation
GET    /api/conversations                              Get User Conversations
GET    /api/conversations/{id}/messages                Get Conversation Messages
POST   /api/conversations/{id}/messages                Send Message (HTTP)
PUT    /api/conversations/messages/read                Mark Messages as Read
```

### SignalR Hub
```
WS     /hubs/chat                       Real-time Messaging Hub
    Methods:
    - SendMessage(conversationId, message)
    - JoinConversation(conversationId)
    - LeaveConversation(conversationId)
    - UserTyping(conversationId)
```

---

## 📝 Service Interfaces

### IAuthService (Sprint 0)
```csharp
Task<string?> RegisterWithEmailAsync(email, password, fullName)
Task<string?> RegisterWithGoogleAsync(googleToken)
Task<string?> LoginWithEmailAsync(email, password)
Task<string?> LoginWithGoogleAsync(googleToken)
Task<bool> ForgotPasswordAsync(email)
Task<bool> ResetPasswordAsync(email, token, newPassword)
Task<bool> ChangePasswordAsync(userId, currentPassword, newPassword)
string GenerateJwtToken(user)
Task<string?> ValidateTokenAsync(token)
```

### IEmailService (Sprint 0)
```csharp
Task<bool> SendEmailAsync(to, subject, htmlContent)
Task<bool> SendPasswordResetEmailAsync(to, resetLink)
Task<bool> SendBookingConfirmationEmailAsync(to, bookingDetails)
Task<bool> SendWelcomeEmailAsync(to, userName)
```

### IPaymentService (Sprint 2)
```csharp
Task<string> CreateCheckoutSessionAsync(title, amount, currency, successUrl, cancelUrl, metadata)
Task<string> HandleWebhookAsync(json, signature)
Task ProcessSuccessfulPaymentAsync(sessionId)
Task<object> GetPaymentDetailsAsync(paymentIntentId)
```

### IMessagingService (Sprint 3)
```csharp
Task<int> SendMessageAsync(conversationId, senderId, content)
Task<int> CreateOrGetConversationAsync(guestId, hostId, listingId)
Task<object> GetConversationMessagesAsync(conversationId)
Task<object> GetUserConversationsAsync(userId)
Task MarkAsReadAsync(messageIds, userId)
```

---

## 🔐 Configuration Required (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;..."
  },
  "Jwt": {
    "SecretKey": "your-secret-key-min-32-chars",
    "Issuer": "AirbnbCloneAPI",
    "Audience": "AirbnbCloneApp",
    "ExpiryMinutes": 60
  },
  "SendGrid": {
    "ApiKey": "SG.your-api-key",
    "FromEmail": "noreply@yourapp.com",
    "FromName": "Airbnb Clone"
  },
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_..."
  },
  "Authentication": {
    "Google": {
      "ClientId": "your-client-id.apps.googleusercontent.com",
      "ClientSecret": "your-client-secret"
    }
  },
  "Frontend": {
    "Url": "http://localhost:4200"
  }
}
```

---

## ⚡ Common Repository Methods

### Base Repository (IRepository<T>)
- `GetByIdAsync(id)`
- `GetAllAsync()`
- `FindAsync(predicate)`
- `AddAsync(entity)`
- `AddRangeAsync(entities)`
- `Update(entity)`
- `Remove(entity)`
- `RemoveRange(entities)`
- `AnyAsync(predicate)`
- `CountAsync(predicate?)`

### Unit of Work
- `CompleteAsync()` - Save all changes
- `BeginTransactionAsync()` - Start transaction
- `CommitTransactionAsync()` - Commit transaction
- `RollbackTransactionAsync()` - Rollback transaction

---

## 🎯 Sprint-to-Component Mapping

| Sprint | Components | Status |
|--------|-----------|--------|
| **Sprint 0** | AuthController, IAuthService, IEmailService | ✅ Scaffolded |
| **Sprint 1** | ListingsController, IListingRepository | 🔶 Repository Ready |
| **Sprint 2** | BookingsController, IPaymentService, IBookingRepository | 🔶 Repository Ready |
| **Sprint 3** | ConversationsController, ChatHub, IMessagingService | ✅ Scaffolded |

---

## 🚀 Quick Start Commands

```bash
# Build solution
dotnet build

# Run API
cd Api
dotnet run

# Create migration
dotnet ef migrations add MigrationName --project Infrastructure --startup-project Api

# Update database
dotnet ef database update --project Infrastructure --startup-project Api

# Run with watch (auto-reload)
cd Api
dotnet watch run
```

---

## ✅ What's Complete

- ✅ All NuGet packages installed
- ✅ Repository pattern fully implemented (5 repositories + UnitOfWork)
- ✅ Service interfaces created with documentation
- ✅ Controllers scaffolded with TODO comments
- ✅ SignalR hub created
- ✅ Program.cs configured
- ✅ CORS enabled for Angular
- ✅ Build succeeds without errors

## 🔶 What's Next

- 🔶 Implement service classes (AuthService, EmailService, etc.)
- 🔶 Create DTOs for request/response
- 🔶 Fill in controller implementations
- 🔶 Configure appsettings.json
- 🔶 Uncomment authentication in Program.cs
- 🔶 Test authentication flow

---

**All repositories are fully implemented and ready to use!** 🎉
