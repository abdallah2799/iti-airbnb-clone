# 🏠 ITI Airbnb Clone - Complete Project Documentation

## Table of Contents
1. Executive Summary
2. Business Overview
3. Technical Architecture
4. Feature Deep Dive
5. Development Workflow
6. Data Model & Schema
7. API Specifications
8. Frontend Architecture
9. AI Integration
10. Security & Authentication
11. Deployment & DevOps

---

## Executive Summary

### Project Vision
The ITI Airbnb Clone is a **full-featured property rental marketplace** built as a graduation project for the ITI Full Stack .NET program. It replicates core Airbnb functionality while demonstrating enterprise-grade software development practices.

### Key Metrics
- **Development Timeline**: 28-day sprint-based approach (7 sprints)
- **Tech Stack**: .NET 9.0 + Angular 17 + SQL Server
- **Architecture**: Clean Architecture with CQRS patterns
- **Features**: 50+ user stories across 3 user roles (Guest, Host, Admin)

### Business Value
- Enables property owners to monetize unused spaces
- Provides travelers with diverse accommodation options
- Facilitates secure transactions and communication
- Builds trust through reviews and verification

---

## Business Overview

### Business Model

#### 1. **Core Value Proposition**
The platform connects two distinct user groups:

**For Hosts (Property Owners):**
- List properties with rich media (photos, descriptions)
- Set pricing and availability
- Manage bookings through dedicated dashboard
- Communicate directly with potential guests
- Build reputation through guest reviews

**For Guests (Travelers):**
- Search accommodations by location, dates, and capacity
- View detailed property information and photos
- Book instantly with secure payment
- Message hosts before/during stay
- Leave reviews based on experience

#### 2. **Revenue Streams**
While MVP focuses on core functionality, production-ready schema supports:
- Service fees (percentage of booking total)
- Cleaning fees (host-defined)
- Premium listing placements
- Host subscriptions (future)

#### 3. **User Roles & Permissions**

| Role | Key Capabilities |
|------|------------------|
| **Guest** | Search listings, make bookings, send messages, leave reviews |
| **Host** | Create listings, manage reservations, respond to inquiries, view earnings |
| **Admin** | Manage users, moderate listings, view platform analytics, handle disputes |

### Customer Journey

#### Guest Journey
```
Discover → Search → View Details → Contact Host → Book → Pay → Stay → Review
```

**Key Touchpoints:**
1. **Discovery**: Homepage with featured listings + search bar
2. **Search**: Filter by location, dates, guests, price range
3. **Property Details**: Photos, amenities, location map, reviews
4. **Booking**: Date selection, guest count, instant price calculation
5. **Payment**: Secure Stripe checkout
6. **Communication**: Real-time chat with host
7. **Post-Stay**: Email reminder to leave review

#### Host Journey
```
Register → Create Listing → Set Pricing → Receive Booking → Communicate → Complete Stay → Receive Payment
```

**Key Touchpoints:**
1. **Onboarding**: Step-by-step listing creation wizard
2. **Listing Management**: Dashboard showing all properties
3. **Reservation Management**: Calendar view of bookings
4. **Guest Communication**: Integrated messaging
5. **Performance Metrics**: Booking rate, earnings, reviews

### Competitive Advantages

1. **AI-Powered Features**
   - Auto-generate listing descriptions using OpenAI
   - Intelligent trip planning with Semantic Kernel
   - RAG-based customer support chatbot

2. **Real-Time Communication**
   - SignalR-powered live chat
   - Instant booking notifications
   - Read receipts and typing indicators

3. **Developer-Friendly**
   - Clean Architecture for maintainability
   - Comprehensive API documentation (Swagger/Scalar)
   - Automated testing infrastructure

---

## Technical Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│  Angular 17 SPA (TypeScript, RxJS, Tailwind CSS)            │
│  - Standalone Components  - Route Guards  - Interceptors    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/SignalR
┌────────────────────▼────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ASP.NET Core 9.0 Web API                                   │
│  - Controllers  - Middleware  - Hubs (SignalR)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  - Services (Business Logic)                                 │
│  - DTOs (Data Transfer Objects)                              │
│  - AutoMapper Profiles                                       │
│  - FluentValidation Rules                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       DOMAIN LAYER                           │
│  - Entities (Listing, Booking, User, Review, etc.)          │
│  - Enums (BookingStatus, PropertyType, etc.)                │
│  - Domain Interfaces (IUnitOfWork, IRepository<T>)          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  - EF Core DbContext                                         │
│  - Repositories (Generic + Specific)                         │
│  - External Services (Stripe, Cloudinary, SendGrid)         │
│  - Agentic AI Services (Semantic Kernel, Qdrant)           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Details

#### Backend (.NET 9.0)

**Core Framework:**
- ASP.NET Core 9.0 Web API
- Entity Framework Core 9.0 (Code-First)
- ASP.NET Core Identity (Authentication/Authorization)

**Libraries & Packages:**
```csharp
// Data Access
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.EntityFrameworkCore.Tools

// Authentication
- Microsoft.AspNetCore.Identity.EntityFrameworkCore
- System.IdentityModel.Tokens.Jwt
- Microsoft.AspNetCore.Authentication.Google

// Payments
- Stripe.net

// Email
- SendGrid / MailKit

// Image Storage
- CloudinaryDotNet

// Real-Time
- Microsoft.AspNetCore.SignalR

// Logging
- Serilog.AspNetCore
- Serilog.Sinks.Console
- Serilog.Sinks.File

// AI/ML
- Microsoft.SemanticKernel
- Qdrant.Client (Vector Database)

// Utilities
- AutoMapper
- FluentValidation
- Hangfire (Background Jobs)
```

#### Frontend (Angular 17)

**Core Framework:**
- Angular 17+ (Standalone Components)
- TypeScript 5.0+
- RxJS 7+ (Reactive Programming)

**UI Libraries:**
```typescript
// Styling
- Tailwind CSS
- Flowbite (Tailwind Components)
- Lucide Angular (Icons)

// Maps
- Leaflet
- ngx-leaflet

// Real-Time
- @microsoft/signalr

// HTTP
- Angular HttpClient
- Angular Router
```

#### Database (SQL Server 2019+)

**Schema Highlights:**
- 14 custom tables + 7 ASP.NET Identity tables
- Optimized indexes for search queries
- Foreign key constraints for data integrity
- Nullable fields for MVP flexibility

### Clean Architecture Implementation

#### Folder Structure
```
src/backend/AirbnbClone/
├── Api/                          # Presentation Layer
│   ├── Controllers/              # REST endpoints
│   ├── Hubs/                     # SignalR hubs
│   ├── Middleware/               # Custom middleware
│   └── Program.cs                # Startup configuration
│
├── Application/                  # Application Layer
│   ├── DTOs/                     # Data transfer objects
│   │   ├── Auth/
│   │   ├── Bookings/
│   │   ├── Listings/
│   │   └── Messaging/
│   ├── Services/                 # Business logic services
│   │   ├── Interfaces/
│   │   └── Implementation/
│   └── Helpers/                  # AutoMapper profiles
│
├── Core/                         # Domain Layer
│   ├── Entities/                 # Domain models
│   │   ├── ApplicationUser.cs
│   │   ├── Listing.cs
│   │   ├── Booking.cs
│   │   ├── Review.cs
│   │   └── ...
│   ├── Enums/                    # Domain enums
│   ├── Interfaces/               # Domain contracts
│   └── DTOs/                     # Shared DTOs
│
├── Infrastructure/               # Infrastructure Layer
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Configurations/       # EF Core configs
│   ├── Repositories/
│   │   ├── Generic/
│   │   └── Specific/
│   └── Services/
│       ├── Email/
│       ├── Payment/
│       └── Storage/
│
└── Infragentic/                  # AI/Agentic Layer
    ├── Plugins/                  # Semantic Kernel plugins
    ├── Services/                 # AI orchestration
    └── Interfaces/
```

#### Dependency Inversion

**Service Registration (Program.cs):**
```csharp
// Core Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IListingService, ListingService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Infrastructure Services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPaymentService, StripePaymentService>();
builder.Services.AddScoped<IPhotoService, CloudinaryPhotoService>();

// Repository Pattern
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
```

---

## Feature Deep Dive

### 1. Authentication & Authorization

#### Email/Password Registration
**User Story:** *As a new user, I want to register with email/password*

**Flow:**
1. User submits registration form (name, email, password)
2. Backend validates input using FluentValidation
3. ASP.NET Core Identity creates user account
4. Password is hashed using PBKDF2
5. JWT token is generated and returned
6. Frontend stores token in localStorage
7. Confirmation email sent via SendGrid

**Technical Implementation:**
```csharp
// AuthController.cs
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    var user = new ApplicationUser
    {
        UserName = dto.Email,
        Email = dto.Email,
        FullName = dto.FullName
    };
    
    var result = await _userManager.CreateAsync(user, dto.Password);
    
    if (result.Succeeded)
    {
        var token = _jwtService.GenerateToken(user);
        await _emailService.SendWelcomeEmailAsync(user.Email);
        return Ok(new { token });
    }
    
    return BadRequest(result.Errors);
}
```

#### Google OAuth Integration
**User Story:** *As a user, I want to login with Google*

**Flow:**
1. User clicks "Login with Google"
2. Redirect to Google OAuth consent screen
3. User authorizes application
4. Google returns authorization code
5. Backend exchanges code for user info
6. Check if user exists, create if new
7. Generate JWT token
8. Redirect to frontend with token

**Configuration:**
```json
// appsettings.json
{
  "Google": {
    "ClientId": "xxx.apps.googleusercontent.com",
    "ClientSecret": "xxx"
  }
}
```

#### JWT Token Structure
```json
{
  "sub": "user-id-guid",
  "email": "user@example.com",
  "role": "Guest",
  "nbf": 1234567890,
  "exp": 1234654290,
  "iat": 1234567890,
  "iss": "AirbnbCloneAPI",
  "aud": "AirbnbCloneApp"
}
```

### 2. Property Listings

#### Listing Creation Wizard
**User Story:** *As a Host, I want to create a listing step-by-step*

**Multi-Step Flow:**
1. **Structure** → Select property type (Apartment, House, Villa, etc.)
2. **Privacy Type** → Entire place, Private room, Shared room
3. **Floor Plan** → Bedrooms, bathrooms, guests capacity
4. **Location** → Address, city, country (with map picker)
5. **Amenities** → WiFi, Kitchen, Parking, etc.
6. **Photos** → Upload up to 10 images
7. **Title** → Catchy listing name
8. **Description** → Detailed property description (AI-assisted)
9. **Pricing** → Price per night
10. **Instant Book** → Enable/disable instant booking
11. **Publish** → Review and publish

**State Management (Angular):**
```typescript
// listing-creation.service.ts
export class ListingCreationService {
  private listingDraft = signal<Partial<CreateListingDto>>({});
  
  updateDraft(step: string, data: any) {
    this.listingDraft.update(draft => ({ ...draft, [step]: data }));
  }
  
  async publishListing() {
    const dto = this.listingDraft();
    return this.http.post('/api/listings', dto).toPromise();
  }
}
```

#### Photo Upload (Cloudinary)
**Technical Flow:**
1. User selects image from file input
2. Frontend validates file type/size
3. POST to `/api/listings/{id}/photos` with FormData
4. Backend receives IFormFile
5. Upload to Cloudinary via SDK
6. Store Cloudinary URL in database
7. Return photo object to frontend

```csharp
// PhotoService.cs
public async Task<PhotoDto> UploadPhotoAsync(IFormFile file, int listingId)
{
    var uploadParams = new ImageUploadParams
    {
        File = new FileDescription(file.FileName, file.OpenReadStream()),
        Folder = "airbnb-clone/listings"
    };
    
    var uploadResult = await _cloudinary.UploadAsync(uploadParams);
    
    var photo = new Photo
    {
        Url = uploadResult.SecureUrl.ToString(),
        PublicId = uploadResult.PublicId,
        ListingId = listingId
    };
    
    await _unitOfWork.Photos.AddAsync(photo);
    await _unitOfWork.SaveChangesAsync();
    
    return _mapper.Map<PhotoDto>(photo);
}
```

### 3. Search & Discovery

#### Advanced Search
**User Story:** *As a Guest, I want to search by location, dates, and guests*

**Search Parameters:**
```typescript
interface SearchParams {
  city?: string;
  country?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType[];
}
```

**Backend Query (LINQ):**
```csharp
public async Task<PagedResult<ListingDto>> SearchListingsAsync(SearchParams params)
{
    var query = _context.Listings
        .Include(l => l.Photos)
        .Include(l => l.Host)
        .Where(l => l.Status == ListingStatus.Published);
    
    // Location filter
    if (!string.IsNullOrEmpty(params.City))
        query = query.Where(l => l.City.Contains(params.City));
    
    // Guest capacity
    if (params.Guests.HasValue)
        query = query.Where(l => l.MaxGuests >= params.Guests.Value);
    
    // Date availability (check no overlapping bookings)
    if (params.CheckIn.HasValue && params.CheckOut.HasValue)
    {
        query = query.Where(l => !l.Bookings.Any(b =>
            b.Status == BookingStatus.Confirmed &&
            b.StartDate < params.CheckOut &&
            b.EndDate > params.CheckIn
        ));
    }
    
    // Price range
    if (params.MinPrice.HasValue)
        query = query.Where(l => l.PricePerNight >= params.MinPrice.Value);
    
    var results = await query
        .OrderByDescending(l => l.CreatedAt)
        .Skip((params.Page - 1) * params.PageSize)
        .Take(params.PageSize)
        .ToListAsync();
    
    return new PagedResult<ListingDto>
    {
        Items = _mapper.Map<List<ListingDto>>(results),
        TotalCount = await query.CountAsync()
    };
}
```

#### Map Integration (Leaflet)
**Implementation:**
```typescript
// search-results.component.ts
import * as L from 'leaflet';

@Component({...})
export class SearchResultsComponent {
  private map!: L.Map;
  
  ngAfterViewInit() {
    this.map = L.map('map').setView([30.0444, 31.2357], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    
    this.listings().forEach(listing => {
      const marker = L.marker([listing.latitude, listing.longitude])
        .bindPopup(`
          <div class="listing-popup">
            <img src="${listing.coverPhoto}" />
            <h4>${listing.title}</h4>
            <p>$${listing.pricePerNight}/night</p>
          </div>
        `);
      marker.addTo(this.map);
    });
  }
}
```

### 4. Booking & Payment

#### Booking Flow
**User Story:** *As a Guest, I want to book and pay securely*

**Step-by-Step:**
1. Guest selects dates and guest count
2. System calculates total price: `nights × pricePerNight`
3. Guest clicks "Reserve"
4. Booking created with `Status = Pending`
5. Redirect to Stripe Checkout
6. Guest completes payment
7. Stripe webhook notifies backend
8. Booking status updated to `Confirmed`
9. Confirmation email sent to both parties

**Stripe Integration:**
```csharp
// PaymentService.cs
public async Task<string> CreateCheckoutSessionAsync(int bookingId)
{
    var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
    
    var sessionOptions = new SessionCreateOptions
    {
        PaymentMethodTypes = new List<string> { "card" },
        LineItems = new List<SessionLineItemOptions>
        {
            new SessionLineItemOptions
            {
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = "usd",
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = booking.Listing.Title,
                        Description = $"{booking.Guests} guests, {booking.Nights} nights"
                    },
                    UnitAmount = (long)(booking.TotalPrice * 100) // Stripe uses cents
                },
                Quantity = 1
            }
        },
        Mode = "payment",
        SuccessUrl = $"{_frontendUrl}/bookings/{bookingId}/success",
        CancelUrl = $"{_frontendUrl}/bookings/{bookingId}/cancel",
        Metadata = new Dictionary<string, string>
        {
            { "bookingId", bookingId.ToString() }
        }
    };
    
    var service = new SessionService();
    var session = await service.CreateAsync(sessionOptions);
    
    return session.Id;
}

// Webhook Handler
[HttpPost("webhook")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], _webhookSecret);
    
    if (stripeEvent.Type == Events.CheckoutSessionCompleted)
    {
        var session = stripeEvent.Data.Object as Session;
        var bookingId = int.Parse(session.Metadata["bookingId"]);
        
        await _bookingService.ConfirmBookingAsync(bookingId, session.PaymentIntentId);
    }
    
    return Ok();
}
```

### 5. Real-Time Messaging (SignalR)

#### Architecture
```
Guest Client ←→ SignalR Hub ←→ Host Client
     ↓              ↓              ↓
  Angular      ASP.NET Core     Angular
```

#### Hub Implementation
```csharp
// ChatHub.cs
[Authorize]
public class ChatHub : Hub
{
    private readonly IMessagingService _messagingService;
    
    public async Task SendMessage(int conversationId, string messageText)
    {
        var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var message = await _messagingService.SendMessageAsync(new SendMessageDto
        {
            ConversationId = conversationId,
            SenderId = userId,
            Text = messageText
        });
        
        // Send to all users in the conversation
        await Clients.Group($"conversation-{conversationId}")
            .SendAsync("ReceiveMessage", message);
    }
    
    public async Task JoinConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation-{conversationId}");
    }
}
```

#### Angular Client
```typescript
// chat.service.ts
export class ChatService {
  private hubConnection!: HubConnection;
  
  startConnection(token: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7088/hubs/chat', {
        accessTokenFactory: () => token
      })
      .build();
    
    this.hubConnection.start().then(() => {
      console.log('SignalR connected');
    });
    
    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      this.messagesSubject.next(message);
    });
  }
  
  sendMessage(conversationId: number, text: string) {
    return this.hubConnection.invoke('SendMessage', conversationId, text);
  }
  
  joinConversation(conversationId: number) {
    return this.hubConnection.invoke('JoinConversation', conversationId);
  }
}
```

### 6. Review System

#### Post-Booking Review
**Business Rule:** Guest can only review after checkout date

**Validation:**
```csharp
public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto)
{
    var booking = await _unitOfWork.Bookings.GetByIdAsync(dto.BookingId);
    
    // Validation: Only allow review after checkout
    if (booking.EndDate > DateTime.UtcNow)
        throw new BusinessException("Cannot review before checkout date");
    
    // Validation: Guest can only review their own bookings
    if (booking.GuestId != _currentUserId)
        throw new UnauthorizedException("Not authorized");
    
    // Validation: One review per booking
    if (booking.Review != null)
        throw new BusinessException("Review already exists");
    
    var review = new Review
    {
        Rating = dto.Rating,
        Comment = dto.Comment,
        BookingId = dto.BookingId,
        GuestId = booking.GuestId,
        ListingId = booking.ListingId,
        DatePosted = DateTime.UtcNow
    };
    
    await _unitOfWork.Reviews.AddAsync(review);
    await _unitOfWork.SaveChangesAsync();
    
    // Update listing average rating
    await UpdateListingAverageRating(booking.ListingId);
    
    return _mapper.Map<ReviewDto>(review);
}
```

#### Rating Aggregation
```csharp
private async Task UpdateListingAverageRating(int listingId)
{
    var reviews = await _unitOfWork.Reviews
        .GetAllAsync(r => r.ListingId == listingId);
    
    var listing = await _unitOfWork.Listings.GetByIdAsync(listingId);
    listing.AverageRating = reviews.Any() 
        ? reviews.Average(r => r.Rating) 
        : 0;
    
    await _unitOfWork.SaveChangesAsync();
}
```

---

## Data Model & Schema

### Entity Relationship Diagram

```
ApplicationUser (ASP.NET Identity)
├─── 1:N → Listing (as Host)
├─── 1:N → Booking (as Guest)
├─── 1:N → Review (as Guest)
├─── 1:N → Message (as Sender)
└─── M:N → UserWishlist

Listing
├─── N:1 → ApplicationUser (Host)
├─── 1:N → Photo
├─── 1:N → Booking
├─── 1:N → Review
└─── M:N → Amenity (via ListingAmenity)

Booking
├─── N:1 → Listing
├─── N:1 → ApplicationUser (Guest)
└─── 1:1 → Review

Conversation
├─── N:1 → Listing
├─── N:1 → ApplicationUser (Guest)
├─── N:1 → ApplicationUser (Host)
└─── 1:N → Message

Message
├─── N:1 → Conversation
└─── N:1 → ApplicationUser (Sender)
```

### Core Tables

#### ApplicationUser
```csharp
public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation Properties
    public ICollection<Listing> Listings { get; set; }
    public ICollection<Booking> Bookings { get; set; }
    public ICollection<Review> Reviews { get; set; }
    public ICollection<Message> SentMessages { get; set; }
}
```

#### Listing
```csharp
public class Listing
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public PropertyType PropertyType { get; set; }
    public int MaxGuests { get; set; }
    public int NumberOfBedrooms { get; set; }
    public int NumberOfBathrooms { get; set; }
    public decimal PricePerNight { get; set; }
    
    // Location
    public string Address { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    // Status
    public ListingStatus Status { get; set; } // Draft, Published, Suspended
    public DateTime CreatedAt { get; set; }
    
    // Metrics
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    
    // Foreign Keys
    public string HostId { get; set; }
    
    // Navigation
    public ApplicationUser Host { get; set; }
    public ICollection<Photo> Photos { get; set; }
    public ICollection<Booking> Bookings { get; set; }
    public ICollection<Review> Reviews { get; set; }
}
```

#### Booking
```csharp
public class Booking
{
    public int Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Guests { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } // Pending, Confirmed, Cancelled, Completed
    public string? PaymentIntentId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Foreign Keys
    public int ListingId { get; set; }
    public string GuestId { get; set; }
    
    // Navigation
    public Listing Listing { get; set; }
    public ApplicationUser Guest { get; set; }
    public Review? Review { get; set; }
    
    // Computed Property
    public int Nights => (EndDate - StartDate).Days;
}
```

#### Review
```csharp
public class Review
{
    public int Id { get; set; }
    public int Rating { get; set; } // 1-5 stars
    public string Comment { get; set; }
    public DateTime DatePosted { get; set; }
    
    // Foreign Keys
    public int BookingId { get; set; }
    public int ListingId { get; set; }
    public string GuestId { get; set; }
    
    // Navigation
    public Booking Booking { get; set; }
    public Listing Listing { get; set; }
    public ApplicationUser Guest { get; set; }
}
```

### Enums

```csharp
public enum PropertyType
{
    Apartment,
    House,
    Villa,
    Cabin,
    Room
}

public enum ListingStatus
{
    Draft,
    Published,
    Suspended
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed
}
```

### Database Indexes (Performance)

```csharp
// ApplicationDbContext.cs - OnModelCreating
modelBuilder.Entity<Listing>()
    .HasIndex(l => l.City);

modelBuilder.Entity<Listing>()
    .HasIndex(l => new { l.City, l.Status });

modelBuilder.Entity<Booking>()
    .HasIndex(b => new { b.StartDate, b.EndDate });

modelBuilder.Entity<Booking>()
    .HasIndex(b => b.GuestId);

modelBuilder.Entity<Review>()
    .HasIndex(r => r.ListingId);
```

---

## API Specifications

### Base URL
```
Development: https://localhost:7088/api
Production: https://api.airbnbclone.com/api
```

### Authentication Endpoints

#### POST `/auth/register`
**Description:** Register new user  
**Auth Required:** No

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-guid",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/auth/login`
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### POST `/auth/google-login`
**Request Body:**
```json
{
  "idToken": "google-oauth-token"
}
```

### Listing Endpoints

#### GET `/listings`
**Description:** Search and filter listings  
**Auth Required:** No

**Query Parameters:**
```
?city=Cairo
&checkIn=2025-06-01
&checkOut=2025-06-07
&guests=2
&minPrice=50
&maxPrice=200
&page=1
&pageSize=12
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Cozy Nile View Apartment",
      "city": "Cairo",
      "country": "Egypt",
      "pricePerNight": 120,
      "coverPhoto": "https://res.cloudinary.com/...",
      "averageRating": 4.8,
      "totalReviews": 24,
      "host": {
        "id": "host-guid",
        "fullName": "Ahmed Hassan",
        "profilePicture": "..."
      }
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 12
}
```

#### POST `/listings`
**Auth Required:** Yes (Host)

**Request Body:**
```json
{
  "title": "Luxurious Villa with Pool",
  "description": "...",
  "propertyType": "Villa",
  "maxGuests": 8,
  "numberOfBedrooms": 4,
  "numberOfBathrooms": 3,
  "pricePerNight": 350,
  "address": "123 Beach Road",
  "city": "Alexandria",
  "country": "Egypt",
  "latitude": 31.2001,
  "longitude": 29.9187
}
```

#### GET `/listings/{id}`
**Response:**
```json
{
  "id": 1,
  "title": "Cozy Nile View Apartment",
  "description": "Full description...",
  "propertyType": "Apartment",
  "maxGuests": 4,
  "numberOfBedrooms": 2,
  "numberOfBathrooms": 1,
  "pricePerNight": 120,
  "address": "...",
  "city": "Cairo",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "averageRating": 4.8,
  "totalReviews": 24,
  "photos": [
    {
      "id": 1,
      "url": "https://...",
      "isCover": true
    }
  ],
  "host": {
    "id": "...",
    "fullName": "Ahmed Hassan",
    "profilePicture": "...",
    "joinedDate": "2024-01-15"
  },
  "reviews": [...]
}
```

#### PUT `/listings/{id}`
**Auth Required:** Yes (Owner only)

#### DELETE `/listings/{id}`
**Auth Required:** Yes (Owner/Admin)

### Booking Endpoints

#### POST `/bookings`
**Auth Required:** Yes (Guest)

**Request Body:**
```json
{
  "listingId": 1,
  "startDate": "2025-06-01",
  "endDate": "2025-06-07",
  "guests": 2
}
```

**Response:**
```json
{
  "id": 123,
  "status": "Pending",
  "totalPrice": 720,
  "nights": 6,
  "checkoutSessionId": "stripe-session-id"
}
```

#### GET `/bookings/my-bookings`
**Auth Required:** Yes (Guest)  
**Description:** Get all bookings for current user

#### GET `/bookings/my-reservations`
**Auth Required:** Yes (Host)  
**Description:** Get all bookings for host's listings

#### PATCH `/bookings/{id}/cancel`
**Auth Required:** Yes (Guest/Owner)

### Review Endpoints

#### POST `/reviews`
**Auth Required:** Yes (Guest)

**Request Body:**
```json
{
  "bookingId": 123,
  "rating": 5,
  "comment": "Amazing stay! Highly recommend."
}
```

#### GET `/listings/{id}/reviews`
**Query Parameters:**
```
?page=1&pageSize=10&sortBy=date&order=desc
```

### Messaging Endpoints

#### GET `/conversations`
**Auth Required:** Yes  
**Description:** Get all conversations for current user

#### POST `/conversations`
**Request Body:**
```json
{
  "listingId": 1,
  "initialMessage": "Hi, is this available for next week?"
}
```

#### GET `/conversations/{id}/messages`
**Description:** Get message history

#### POST `/conversations/{id}/messages`
**Request Body:**
```json
{
  "text": "Yes, it's available!"
}
```

---

## Frontend Architecture

### Component Structure

```
src/app/
├── core/                           # Singleton services, guards
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   └── admin.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── guest-view.guard.ts
│   │   └── host-view.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── models/
│
├── features/                       # Feature modules
│   ├── auth/
│   │   ├── login-modal/
│   │   └── register/
│   ├── public/
│   │   ├── listing-details/
│   │   └── search-results/
│   ├── host/
│   │   ├── dashboard/
│   │   ├── listing-intro/
│   │   └── steps/
│   │       ├── structure/
│   │       ├── floor-plan/
│   │       ├── location/
│   │       └── publish/
│   ├── checkout/
│   └── admin/
│
└── shared/                         # Reusable components
    ├── components/
    │   ├── navbar/
    │   ├── footer/
    │   ├── search-bar/
    │   └── chat-widget/
    └── models/
```

### State Management (Signals)

```typescript
// listing-creation.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ListingCreationService {
  // Draft state persisted across steps
  private draft = signal<Partial<CreateListingDto>>({
    propertyType: undefined,
    maxGuests: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    photos: []
  });
  
  // Expose read-only state
  readonly listingDraft = this.draft.asReadonly();
  
  // Update methods
  updateStructure(propertyType: PropertyType) {
    this.draft.update(d => ({ ...d, propertyType }));
  }
  
  updateFloorPlan(bedrooms: number, bathrooms: number, guests: number) {
    this.draft.update(d => ({
      ...d,
      numberOfBedrooms: bedrooms,
      numberOfBathrooms: bathrooms,
      maxGuests: guests
    }));
  }
  
  // Clear draft after publish
  reset() {
    this.draft.set({});
  }
}
```

### Routing & Guards

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: BlankLayoutComponent,
    canActivate: [notAdminGuard],
    children: [
      { 
        path: '', 
        component: HomeComponent, 
        canActivate: [homeRedirectGuard] 
      },
      {
        path: 'rooms/:id',
        loadComponent: () => import('./features/public/listing-details/...'),
        canActivate: [guestViewGuard]
      },
      {
        path: 'checkout/:bookingId',
        component: CheckoutComponent,
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: 'hosting',
    canActivate: [hostViewGuard],
    children: [
      { path: 'intro', component: ListingIntroComponent },
      { path: 'structure', component: StructureComponent },
      { path: 'floor-plan', component: FloorPlanComponent },
      // ... other steps
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminViewGuard],
    children: [...]
  }
];
```

### HTTP Interceptor (JWT)

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};
```

### Service Layer Example

```typescript
// listing.service.ts
@Injectable({ providedIn: 'root' })
export class ListingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  getListings(params: SearchParams): Observable<PagedResult<ListingDto>> {
    let httpParams = new HttpParams();
    
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.checkIn) httpParams = httpParams.set('checkIn', params.checkIn.toISOString());
    // ... other params
    
    return this.http.get<PagedResult<ListingDto>>(`${this.apiUrl}/listings`, { params: httpParams });
  }
  
  getListingDetails(id: number): Observable<ListingDetailsDto> {
    return this.http.get<ListingDetailsDto>(`${this.apiUrl}/listings/${id}`);
  }
  
  createListing(dto: CreateListingDto): Observable<ListingDto> {
    return this.http.post<ListingDto>(`${this.apiUrl}/listings`, dto);
  }
  
  uploadPhoto(listingId: number, file: File): Observable<PhotoDto> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<PhotoDto>(`${this.apiUrl}/listings/${listingId}/photos`, formData);
  }
}
```

---

## AI Integration

### Semantic Kernel Architecture

The project uses **Microsoft Semantic Kernel** to orchestrate AI workflows with multiple models and plugins.

#### Kernel Configuration

```csharp
// Program.cs - AI Setup
builder.Services.AddAgenticInfrastructure(
    openRouterKey: builder.Configuration["AI:OpenAIKey"],
    chatModelId: "meta-llama/llama-3.3-70b-instruct", // Fast Q&A
    plannerModelId: "anthropic/claude-3.5-sonnet",    // Complex reasoning
    chatEndpoint: builder.Configuration["AI:OpenAIEndpoint"],
    qdrantHost: "localhost",
    qdrantPort: 6334,
    embeddingModelId: "text-embedding-3-small"
);
```

### Use Case 1: AI Listing Description Generator

**User Story:** *As a Host, I want AI to generate professional descriptions*

**Implementation:**
```csharp
// CopywritingPlugin.cs
public class CopywritingPlugin
{
    [KernelFunction("generate_descriptions")]
    [Description("Generates catchy marketing descriptions for an Airbnb property.")]
    public async Task<string> GenerateDescriptionsAsync(
        Kernel kernel,
        [Description("The full details of the property")] string propertyDetails)
    {
        var prompt = @"
            You are an expert Airbnb copywriter. 
            Write 5 catchy, distinct descriptions for: {{$propertyDetails}}
            
            Rules:
            - Exciting and inviting
            - Under 50 words each
            - Separate with '|||'
            - No numbering
        ";
        
        var result = await kernel.InvokePromptAsync(prompt, new KernelArguments
        {
            ["propertyDetails"] = propertyDetails
        });
        
        return result.GetValue<string>();
    }
}
```

**Frontend Usage:**
```typescript
// description.component.ts
generateDescription() {
  this.aiService.generateDescription({
    propertyType: 'Villa',
    bedrooms: 4,
    city: 'Alexandria',
    features: ['Pool', 'Beach View', 'Modern Kitchen']
  }).subscribe(descriptions => {
    this.descriptions = descriptions.split('|||');
  });
}
```

### Use Case 2: RAG-Powered Customer Support

**Architecture:**
```
User Question
    ↓
Semantic Search (Qdrant Vector DB)
    ↓
Retrieve Top 3 FAQ Matches
    ↓
Inject into LLM Context
    ↓
Generate Contextual Answer
```

**Implementation:**
```csharp
// AgenticContentGenerator.cs
public async Task<string> AnswerQuestionWithRagAsync(string question)
{
    // 1. Search vector database for relevant FAQs
    var ragContext = await _knowledgeBase.SearchKnowledgeAsync(question);
    
    // 2. Construct prompt with retrieved context
    var systemPrompt = $@"
        You are an intelligent Assistant for Airbnb Clone.
        
        === CONTEXT (Internal Knowledge) ===
        {ragContext}
        
        === YOUR TASK ===
        Answer the user's question using the context above.
        If you cannot answer, say 'I don't have that information.'
    ";
    
    // 3. Call LLM with context
    var result = await _kernel.InvokePromptAsync(systemPrompt + question);
    
    return result.GetValue<string>();
}
```

**Knowledge Base (JSON):**
```json
// knowledge.json
[
  {
    "id": "cancellation-policy",
    "question": "What is your cancellation policy?",
    "answer": "Guests can cancel up to 48 hours before check-in for a full refund."
  },
  {
    "id": "payment-methods",
    "question": "What payment methods do you accept?",
    "answer": "We accept all major credit cards via Stripe (Visa, Mastercard, Amex)."
  }
]
```

### Use Case 3: Trip Planner Workflow

**Business Logic:**
After a booking is confirmed, automatically:
1. Fetch weather forecast for destination
2. Retrieve local events during stay
3. Generate personalized trip itinerary
4. Send email to guest

**Workflow Orchestration:**
```csharp
// AgenticWorkflowService.cs
public async Task ExecuteTripPlannerWorkflowAsync(int bookingId)
{
    var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
    
    // Parallel data fetch
    var weatherTask = _tripEnrichment.GetWeatherForecastAsync(
        booking.Listing.Latitude, 
        booking.Listing.Longitude,
        booking.StartDate, 
        booking.EndDate
    );
    
    var eventsTask = _tripEnrichment.GetLocalEventsAsync(
        booking.Listing.City,
        booking.StartDate,
        booking.EndDate
    );
    
    await Task.WhenAll(weatherTask, eventsTask);
    
    // Construct AI prompt
    var prompt = $@"
        Write a warm 'Trip Briefing' email for {booking.Guest.FullName}.
        
        CITY: {booking.Listing.City}
        WEATHER: {await weatherTask}
        EVENTS: {await eventsTask}
        HOUSE RULES: {booking.Listing.Description}
        
        Include:
        1. Welcome message
        2. Weather outlook
        3. Top 3 events
        4. Quick house rules reminder
        
        Execute 'send_trip_briefing_email' tool.
    ";
    
    // Auto-invoke email plugin
    await _kernel.InvokePromptAsync(prompt, new KernelArguments
    {
        ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
    });
}
```

**Email Plugin:**
```csharp
[KernelFunction("send_trip_briefing_email")]
public async Task SendTripBriefingAsync(
    [Description("Guest email")] string email,
    [Description("Email subject")] string subject,
    [Description("HTML email body")] string body)
{
    await _emailService.SendEmailAsync(email, subject, body);
}
```

---

## Security & Authentication

### JWT Token Flow

```
1. User Login (POST /api/auth/login)
        ↓
2. Backend validates credentials
        ↓
3. Generate JWT with claims:
   - UserId (GUID)
   - Email
   - Role (Guest/Host/Admin)
   - Expiration (60 minutes)
        ↓
4. Return token to client
        ↓
5. Client stores in localStorage
        ↓
6. Include in Authorization header for subsequent requests:
   Authorization: Bearer <token>
        ↓
7. Backend validates token on each request
        ↓
8. Extract user context from claims
```

### Password Security

```csharp
// ASP.NET Core Identity Configuration
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password requirements
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    
    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false; // Set true in production
});

// Password hashing: PBKDF2 with HMAC-SHA256, 10,000 iterations
```

### CORS Configuration

```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",  // Angular dev server
                "https://airbnbclone.com" // Production domain
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()  // Required for SignalR
            .WithExposedHeaders("Content-Disposition");
    });
});
```

### Role-Based Authorization

```csharp
// Protect endpoints by role
[Authorize(Roles = "Host")]
[HttpPost("listings")]
public async Task<IActionResult> CreateListing([FromBody] CreateListingDto dto)
{
    // Only Hosts can create listings
}

[Authorize(Roles = "Admin")]
[HttpDelete("users/{id}")]
public async Task<IActionResult> DeleteUser(string id)
{
    // Only Admins can delete users
}
```

### Input Validation (FluentValidation)

```csharp
// CreateListingDtoValidator.cs
public class CreateListingDtoValidator : AbstractValidator<CreateListingDto>
{
    public CreateListingDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");
        
        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(2000);
        
        RuleFor(x => x.PricePerNight)
            .GreaterThan(0).WithMessage("Price must be positive")
            .LessThan(10000).WithMessage("Price too high");
        
        RuleFor(x => x.MaxGuests)
            .InclusiveBetween(1, 20);
    }
}
```

### SQL Injection Prevention

Entity Framework Core uses **parameterized queries** by default:

```csharp
// SAFE (parameterized)
var listings = await _context.Listings
    .Where(l => l.City == userInput)
    .ToListAsync();

// UNSAFE (avoid raw SQL with user input)
var listings = await _context.Listings
    .FromSqlRaw($"SELECT * FROM Listings WHERE City = '{userInput}'") // ❌ SQL Injection risk
    .ToListAsync();
```

---

## Deployment & DevOps

### Development Environment Setup

**PowerShell Script (start-dev.ps1):**
```powershell
# 1. Start Qdrant (Vector DB for AI)
docker start qdrant

# 2. Start Backend (.NET API)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ApiFolder'; dotnet run"

# 3. Start Frontend (Angular)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$UiFolder'; npm start"

# 4. Start Stripe CLI (Webhook forwarding)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "stripe listen --forward-to $StripeTarget"

# 5. Expose localhost with Playit.gg
Start-Process -FilePath $PlayitPath
```

### Database Migrations

```bash
# Create migration
dotnet ef migrations add AddPhotosTables --project Infrastructure --startup-project Api

# Update database
dotnet ef database update --project Infrastructure --startup-project Api

# Rollback migration
dotnet ef database update PreviousMigrationName --project Infrastructure --startup-project Api
```

### Production Deployment (Azure)

#### Backend (Azure App Service)
```bash
# Publish application
dotnet publish -c Release -o ./publish

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group airbnb-clone-rg \
  --name airbnb-clone-api \
  --src publish.zip
```

#### Frontend (Azure Static Web Apps)
```bash
# Build for production
ng build --configuration production

# Deploy
az staticwebapp deploy \
  --name airbnb-clone-frontend \
  --resource-group airbnb-clone-rg \
  --app-location dist/airbnb-clone
```

#### Database (Azure SQL)
```bash
# Connection string in Azure App Service Configuration
Server=tcp:airbnb-clone-server.database.windows.net,1433;
Database=AirbnbClone;
User ID=adminuser;
Password=SecurePassword123!;
Encrypt=True;
TrustServerCertificate=False;
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '9.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
      working-directory: ./src/backend/AirbnbClone
    
    - name: Build
      run: dotnet build --configuration Release
      working-directory: ./src/backend/AirbnbClone
    
    - name: Publish
      run: dotnet publish -c Release -o ./publish
      working-directory: ./src/backend/AirbnbClone/Api
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'airbnb-clone-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './src/backend/AirbnbClone/Api/publish'
```

### Environment Variables

**Backend (`appsettings.Production.json`):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "{{AZURE_SQL_CONNECTION_STRING}}"
  },
  "JwtSettings": {
    "SecretKey": "{{JWT_SECRET_KEY}}",
    "ExpirationMinutes": 60
  },
  "Stripe": {
    "SecretKey": "{{STRIPE_SECRET_KEY}}",
    "WebhookSecret": "{{STRIPE_WEBHOOK_SECRET}}"
  },
  "SendGrid": {
    "ApiKey": "{{SENDGRID_API_KEY}}"
  },
  "Cloudinary": {
    "CloudName": "{{CLOUDINARY_CLOUD_NAME}}",
    "ApiKey": "{{CLOUDINARY_API_KEY}}",
    "ApiSecret": "{{CLOUDINARY_API_SECRET}}"
  }
}
```

**Frontend (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.airbnbclone.com/api',
  stripePublishableKey: 'pk_live_...',
  googleClientId: 'xxx.apps.googleusercontent.com'
};
```

---

## Conclusion

### Project Achievements

✅ **Full-Stack Implementation**
- .NET 9.0 backend with Clean Architecture
- Angular 17 frontend with reactive patterns
- SQL Server database with optimized schema

✅ **Enterprise Features**
- JWT authentication + Google OAuth
- Stripe payment integration
- Real-time chat (SignalR)
- AI-powered content generation
- Email notifications
- Image upload (Cloudinary)

✅ **Best Practices**
- Repository pattern + Unit of Work
- DTOs for layer separation
- FluentValidation for input validation
- Logging with Serilog
- API documentation (Swagger/Scalar)

✅ **Agile Development**
- 14-day sprint plan executed
- 50+ user stories completed
- Comprehensive documentation

### Future Enhancements

🔮 **Phase 2 Features:**
- Amenities filtering
- Advanced pricing (cleaning fees, dynamic pricing)
- Check-in/out time management
- Calendar blocking
- Multi-currency support
- Host verification badges

🔮 **Technical Improvements:**
- Redis caching for performance
- ElasticSearch for advanced search
- GraphQL API alternative
- Mobile app (React Native/Flutter)
- Microservices architecture
- Kubernetes deployment

### Learning Outcomes

This project demonstrates:
- Full-stack development proficiency
- RESTful API design
- Database normalization
- Authentication & authorization
- Third-party integrations
- AI/ML integration
- DevOps practices
- Agile methodology

---

**Made with ❤️ by ITI Full Stack .NET Students**