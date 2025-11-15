# Airbnb Clone: Production Database Schema

> **📌 IMPORTANT:** This is the COMPLETE production-ready database schema. All advanced features are built-in but optional. You can develop the MVP using only the core fields and gradually adopt advanced features.

---

## 🎯 Purpose

This schema is designed to support a **full-featured Airbnb clone** with enterprise-level capabilities while remaining flexible for MVP development. All enhanced features use nullable fields or defaults, so you can:

1. ✅ Build MVP with core fields only
2. ✅ Add advanced features incrementally
3. ✅ Never worry about breaking schema changes

---

## 📊 Database Overview

### Tables Summary
| Category | Tables | Purpose |
|----------|--------|---------|
| **Identity** | AspNetUsers + 6 Identity tables | User authentication & authorization |
| **Core Listings** | Listing, Photo | Property listings and images |
| **Bookings** | Booking, Review | Reservations and guest feedback |
| **Communication** | Conversation, Message | Guest-Host messaging |
| **Features** | Amenity, ListingAmenity, BlockedDate | Enhanced functionality |
| **User Features** | UserWishlist, Notification | User engagement |

**Total: 14 Custom Tables + 7 ASP.NET Identity Tables**

---

## 📋 Detailed Table Descriptions

### 1. ApplicationUser (Enhanced)
**Inherits from:** `AspNetUsers` (ASP.NET Core Identity)  
**Purpose:** All users (Guests and Hosts) with verification and metrics

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| **Core Identity Fields** |
| Id | string (GUID) | ✅ | ✅ | Primary Key (Identity managed) |
| Email | string | ✅ | ✅ | User email for login |
| UserName | string | ✅ | ✅ | Username for login |
| PasswordHash | string | ✅ | ✅ | Hashed password (Identity) |
| PhoneNumber | string? | ❌ | ❌ | Phone number (Identity) |
| EmailConfirmed | bool | ✅ | ✅ | Email verified (Identity) |
| **Profile Fields** |
| Bio | string? | ❌ | ✅ | User biography (max 1000 chars) |
| ProfilePictureUrl | string? | ❌ | ✅ | Profile photo URL (max 500 chars) |
| **Verification (Enhanced)** |
| PhoneNumberVerified | bool | ✅ | ❌ | Phone verified (default: false) |
| GovernmentIdVerified | bool | ✅ | ❌ | ID verified (default: false) |
| VerifiedAt | datetime? | ❌ | ❌ | When verification completed |
| **Host Metrics (Enhanced)** |
| HostResponseRate | decimal? | ❌ | ❌ | Response rate % (0-100) |
| HostResponseTimeMinutes | int? | ❌ | ❌ | Avg response time in minutes |
| HostSince | datetime? | ❌ | ❌ | When became a host |
| **Account Management** |
| CreatedAt | datetime | ✅ | ✅ | Account creation (auto-set) |
| LastLoginAt | datetime? | ❌ | ❌ | Last login timestamp |

**Relationships:**
- 1:N → Listings (as Host)
- 1:N → Bookings (as Guest)
- 1:N → ConversationsAsGuest
- 1:N → ConversationsAsHost
- 1:N → Messages
- 1:N → Reviews
- M:N → UserWishlists
- 1:N → Notifications

**MVP Usage:**
```csharp
// MVP: Just create user with basic profile
var user = new ApplicationUser 
{
    UserName = "john@example.com",
    Email = "john@example.com",
    Bio = "Love traveling!",
    ProfilePictureUrl = "/uploads/profile.jpg"
    // Other fields auto-default or null
};
```

---

### 2. Listing (Enhanced)
**Purpose:** Property for rent with full pricing and booking rules

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| **Core Fields** |
| Id | int | ✅ | ✅ | Primary Key |
| Title | string | ✅ | ✅ | Listing title (max 200) |
| Description | string | ✅ | ✅ | Full description (max 2000) |
| HostId | string (GUID) | ✅ | ✅ | FK to ApplicationUser |
| **Property Details** |
| PropertyType | enum | ✅ | ✅ | Apartment, House, Villa, Cabin, Room |
| MaxGuests | int | ✅ | ✅ | Maximum guests allowed |
| NumberOfBedrooms | int | ✅ | ✅ | Number of bedrooms |
| NumberOfBathrooms | int | ✅ | ✅ | Number of bathrooms |
| **Location** |
| Address | string | ✅ | ✅ | Street address (max 500) |
| City | string | ✅ | ✅ | City (max 100) |
| Country | string | ✅ | ✅ | Country (max 100) |
| Latitude | double? | ❌ | ✅ | GPS coordinate for map |
| Longitude | double? | ❌ | ✅ | GPS coordinate for map |
| **Pricing (Enhanced)** |
| PricePerNight | decimal(18,2) | ✅ | ✅ | Base nightly rate |
| CleaningFee | decimal(18,2)? | ❌ | ❌ | One-time cleaning charge |
| ServiceFee | decimal(18,2)? | ❌ | ❌ | Platform service fee |
| Currency | string | ✅ | ❌ | Currency code (default: "USD") |
| **Booking Rules (Enhanced)** |
| MinimumNights | int? | ❌ | ❌ | Minimum stay requirement |
| MaximumNights | int? | ❌ | ❌ | Maximum stay limit |
| CheckInTime | TimeSpan? | ❌ | ❌ | e.g., 15:00 (3 PM) |
| CheckOutTime | TimeSpan? | ❌ | ❌ | e.g., 11:00 (11 AM) |
| CancellationPolicy | enum? | ❌ | ❌ | Flexible, Moderate, Strict, SuperStrict |
| InstantBooking | bool | ✅ | ❌ | Auto-confirm (default: false) |
| **Status & Management** |
| Status | enum | ✅ | ✅ | Draft, Published, Inactive, Suspended |
| CreatedAt | datetime | ✅ | ✅ | When listing created |
| UpdatedAt | datetime? | ❌ | ❌ | Last modification time |

**Relationships:**
- N:1 → Host (ApplicationUser)
- 1:N → Photos
- 1:N → Bookings
- 1:N → Reviews
- 1:N → Conversations
- M:N → UserWishlists
- M:N → ListingAmenities (Enhanced)
- 1:N → BlockedDates (Enhanced)

**MVP Usage:**
```csharp
// MVP: Simple listing with core fields only
var listing = new Listing 
{
    Title = "Cozy Apartment in Downtown",
    Description = "Beautiful 2BR apartment...",
    PricePerNight = 120.00m,
    MaxGuests = 4,
    NumberOfBedrooms = 2,
    NumberOfBathrooms = 1,
    PropertyType = PropertyType.Apartment,
    Address = "123 Main St",
    City = "New York",
    Country = "USA",
    Status = ListingStatus.Published,
    HostId = userId
    // Advanced fields stay null/default
};
```

**Production Usage:**
```csharp
// Production: Full featured listing
listing.CleaningFee = 50.00m;
listing.ServiceFee = 15.00m;
listing.MinimumNights = 2;
listing.CheckInTime = new TimeSpan(15, 0, 0); // 3 PM
listing.CheckOutTime = new TimeSpan(11, 0, 0); // 11 AM
listing.CancellationPolicy = CancellationPolicy.Moderate;
listing.InstantBooking = true;
```

---

### 3. Photo
**Purpose:** Listing images

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ✅ | Primary Key |
| Url | string | ✅ | ✅ | Image URL (max 500) |
| IsCover | bool | ✅ | ✅ | Is main/cover photo |
| ListingId | int | ✅ | ✅ | FK to Listing |

**Business Logic:**
- Each listing can have multiple photos
- One photo must be marked as cover (IsCover = true)
- Cover photo displays on listing cards

---

### 4. Amenity (Enhanced)
**Purpose:** Reusable amenities catalog (WiFi, Pool, Parking, etc.)

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ❌ | Primary Key |
| Name | string | ✅ | ❌ | Amenity name (max 100) |
| Icon | string? | ❌ | ❌ | Icon name/URL (max 200) |
| Category | string | ✅ | ❌ | "Basic", "Safety", "Entertainment" (max 50) |

**Common Amenities:**
- **Basic:** WiFi, Kitchen, Washer, Dryer, Air conditioning, Heating
- **Safety:** Smoke alarm, Carbon monoxide alarm, Fire extinguisher, First aid kit
- **Entertainment:** TV, Netflix, Board games, Pool table
- **Outdoor:** Pool, Hot tub, BBQ grill, Patio, Garden
- **Parking:** Free parking, Paid parking, EV charger

**MVP Usage:** Skip for MVP, add later when implementing filters

---

### 5. ListingAmenity (Enhanced)
**Purpose:** Many-to-many join table (Listing ↔ Amenity)

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| ListingId | int | ✅ | ❌ | Composite PK, FK to Listing |
| AmenityId | int | ✅ | ❌ | Composite PK, FK to Amenity |

**Usage:**
```csharp
// Assign amenities to a listing
listing.ListingAmenities.Add(new ListingAmenity { AmenityId = wifiId });
listing.ListingAmenities.Add(new ListingAmenity { AmenityId = poolId });
```

---

### 6. BlockedDate (Enhanced)
**Purpose:** Unavailable dates for listings

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ❌ | Primary Key |
| Date | datetime | ✅ | ❌ | Blocked date |
| Reason | string? | ❌ | ❌ | "Booked", "Maintenance", "Host blocked" |
| ListingId | int | ✅ | ❌ | FK to Listing |

**Business Logic:**
- Automatically block dates when booking is confirmed
- Host can manually block dates for maintenance
- Check availability before allowing bookings

**Index:** (ListingId, Date) for fast lookups

---

### 7. Booking (Enhanced)
**Purpose:** Guest reservation with payment tracking

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| **Core Booking** |
| Id | int | ✅ | ✅ | Primary Key |
| StartDate | datetime | ✅ | ✅ | Check-in date |
| EndDate | datetime | ✅ | ✅ | Check-out date |
| Guests | int | ✅ | ✅ | Number of guests |
| Status | enum | ✅ | ✅ | Pending, Confirmed, Cancelled |
| GuestId | string (GUID) | ✅ | ✅ | FK to ApplicationUser |
| ListingId | int | ✅ | ✅ | FK to Listing |
| **Pricing (Enhanced)** |
| TotalPrice | decimal(18,2) | ✅ | ✅ | Total amount charged |
| CleaningFee | decimal(18,2)? | ❌ | ❌ | Captured from listing |
| ServiceFee | decimal(18,2)? | ❌ | ❌ | Captured from listing |
| **Payment (Enhanced)** |
| StripePaymentIntentId | string? | ❌ | ✅ | Stripe payment ID (max 200) |
| PaymentStatus | enum? | ❌ | ❌ | Pending, Completed, Failed, Refunded, PartiallyRefunded |
| PaidAt | datetime? | ❌ | ❌ | Payment timestamp |
| **Refund (Enhanced)** |
| RefundAmount | decimal(18,2)? | ❌ | ❌ | Amount refunded |
| RefundedAt | datetime? | ❌ | ❌ | Refund timestamp |
| CancellationReason | string? | ❌ | ❌ | Why cancelled (max 500) |
| **Timestamps** |
| CreatedAt | datetime | ✅ | ✅ | When booking created |
| CancelledAt | datetime? | ❌ | ❌ | When cancelled |

**Relationships:**
- N:1 → Guest (ApplicationUser)
- N:1 → Listing
- 1:1 → Review

**Business Flow:**
1. **Create Booking:** Status = Pending, calculate TotalPrice
2. **Process Payment:** Update PaymentStatus, PaidAt, Status = Confirmed
3. **Complete Stay:** Guest can leave Review
4. **Cancellation:** Set Status = Cancelled, process refund based on CancellationPolicy

**MVP Usage:**
```csharp
var booking = new Booking 
{
    StartDate = checkIn,
    EndDate = checkOut,
    Guests = 2,
    TotalPrice = nights * listing.PricePerNight,
    Status = BookingStatus.Pending,
    GuestId = guestId,
    ListingId = listingId
};
```

---

### 8. Review (Enhanced)
**Purpose:** Guest feedback with detailed ratings

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ✅ | Primary Key |
| **Overall Rating** |
| Rating | int | ✅ | ✅ | Overall rating 1-5 stars |
| Comment | string | ✅ | ✅ | Review text (max 1000) |
| DatePosted | datetime | ✅ | ✅ | When posted |
| **Detailed Ratings (Enhanced)** |
| CleanlinessRating | int? | ❌ | ❌ | 1-5 stars |
| AccuracyRating | int? | ❌ | ❌ | 1-5 stars |
| CommunicationRating | int? | ❌ | ❌ | 1-5 stars |
| LocationRating | int? | ❌ | ❌ | 1-5 stars |
| CheckInRating | int? | ❌ | ❌ | 1-5 stars |
| ValueRating | int? | ❌ | ❌ | 1-5 stars |
| **Foreign Keys** |
| BookingId | int | ✅ | ✅ | FK to Booking (unique) |
| ListingId | int | ✅ | ✅ | FK to Listing |
| GuestId | string (GUID) | ✅ | ✅ | FK to ApplicationUser |

**Relationships:**
- 1:1 → Booking
- N:1 → Listing
- N:1 → Guest

**Business Logic:**
- Guest can only review after checkout
- One review per booking
- Calculate listing average from all reviews

**MVP Usage:**
```csharp
var review = new Review 
{
    Rating = 5,
    Comment = "Amazing stay! Highly recommend.",
    DatePosted = DateTime.UtcNow,
    BookingId = bookingId,
    ListingId = listingId,
    GuestId = guestId
    // Detailed ratings optional
};
```

---

### 9. Conversation
**Purpose:** Chat room between Guest and Host

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ✅ | Primary Key |
| GuestId | string (GUID) | ✅ | ✅ | FK to ApplicationUser (Guest) |
| HostId | string (GUID) | ✅ | ✅ | FK to ApplicationUser (Host) |
| ListingId | int | ✅ | ✅ | FK to Listing |

**Relationships:**
- N:1 → Guest (ApplicationUser)
- N:1 → Host (ApplicationUser)
- N:1 → Listing
- 1:N → Messages

**Business Logic:**
- One conversation per Guest-Host-Listing combination
- Created when guest first messages host about a listing

---

### 10. Message
**Purpose:** Individual messages in a conversation

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ✅ | Primary Key |
| Content | string | ✅ | ✅ | Message text (max 2000) |
| Timestamp | datetime | ✅ | ✅ | When sent |
| IsRead | bool | ✅ | ✅ | Read status |
| ConversationId | int | ✅ | ✅ | FK to Conversation |
| SenderId | string (GUID) | ✅ | ✅ | FK to ApplicationUser |

**Relationships:**
- N:1 → Conversation
- N:1 → Sender (ApplicationUser)

---

### 11. UserWishlist
**Purpose:** Many-to-many join (User favorites)

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| ApplicationUserId | string (GUID) | ✅ | ✅ | Composite PK, FK to User |
| ListingId | int | ✅ | ✅ | Composite PK, FK to Listing |

**Business Logic:**
- Users can save favorite listings
- Display saved listings on user dashboard

---

### 12. Notification
**Purpose:** User notifications

| Column Name | Type | Required | MVP? | Notes |
|------------|------|----------|------|-------|
| Id | int | ✅ | ✅ | Primary Key |
| Message | string | ✅ | ✅ | Notification text (max 500) |
| IsRead | bool | ✅ | ✅ | Read status |
| Timestamp | datetime | ✅ | ✅ | When created |
| LinkUrl | string? | ❌ | ❌ | Optional navigation URL (max 500) |
| UserId | string (GUID) | ✅ | ✅ | FK to ApplicationUser |

**Relationships:**
- N:1 → User (ApplicationUser)

**Examples:**
- "Your booking at Cozy Apartment is confirmed!"
- "John Doe left you a 5-star review"
- "You have a new message from Sarah"

---

## 🔢 Enums Reference

### PropertyType
```csharp
public enum PropertyType
{
    Apartment = 0,
    House = 1,
    Villa = 2,
    Cabin = 3,
    Room = 4
}
```

### BookingStatus
```csharp
public enum BookingStatus
{
    Pending = 0,      // Awaiting payment/confirmation
    Confirmed = 1,    // Payment successful, booking active
    Cancelled = 2     // Cancelled by guest or host
}
```

### ListingStatus (Enhanced)
```csharp
public enum ListingStatus
{
    Draft = 0,       // Not published yet
    Published = 1,   // Visible and bookable
    Inactive = 2,    // Temporarily disabled by host
    Suspended = 3    // Suspended by admin
}
```

### CancellationPolicy (Enhanced)
```csharp
public enum CancellationPolicy
{
    Flexible = 0,     // Full refund 1 day prior
    Moderate = 1,     // Full refund 5 days prior
    Strict = 2,       // Full refund 7 days prior
    SuperStrict = 3   // 50% refund up to 30 days
}
```

### PaymentStatus (Enhanced)
```csharp
public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3,
    PartiallyRefunded = 4
}
```

---

## 🚀 Development Strategy

### Phase 1: MVP (Core Features)
**Use only fields marked with MVP? = ✅**

**Focus on:**
- User authentication (Identity)
- Create/view listings (core fields only)
- Basic booking flow
- Simple reviews (overall rating)
- Basic messaging

**Skip for MVP:**
- Amenities filtering
- Advanced pricing (cleaning/service fees)
- Booking rules (min nights, check-in times)
- Verification badges
- Blocked dates
- Detailed review ratings
- Host metrics

### Phase 2: Enhanced Features
**Gradually adopt nullable fields**

**Add incrementally:**
1. Cleaning fees & service fees
2. Amenities and filtering
3. Check-in/check-out times
4. Minimum nights requirements
5. Detailed review ratings
6. Host verification badges
7. Calendar blocking

### Phase 3: Production Polish
**Implement remaining features**

- Advanced payment tracking
- Cancellation policies with refunds
- Host response metrics
- Multi-currency support
- Government ID verification

---

## 💡 Business Logic Examples

### Booking Flow
```csharp
// 1. Check availability
var isAvailable = !context.Bookings.Any(b => 
    b.ListingId == listingId && 
    b.Status == BookingStatus.Confirmed &&
    b.StartDate < checkout && b.EndDate > checkin);

// 2. Calculate price (MVP)
var nights = (checkout - checkin).Days;
var totalPrice = nights * listing.PricePerNight;

// 3. Calculate price (Production)
var totalPrice = (nights * listing.PricePerNight) 
               + (listing.CleaningFee ?? 0) 
               + (listing.ServiceFee ?? 0);

// 4. Create booking
var booking = new Booking { /* ... */ Status = BookingStatus.Pending };

// 5. Process payment (Stripe)
var paymentIntent = await stripe.CreatePaymentIntent(totalPrice);
booking.StripePaymentIntentId = paymentIntent.Id;
booking.PaymentStatus = PaymentStatus.Pending;

// 6. Confirm on success
booking.Status = BookingStatus.Confirmed;
booking.PaymentStatus = PaymentStatus.Completed;
booking.PaidAt = DateTime.UtcNow;

// 7. Block dates (Production)
for (var date = checkin; date < checkout; date = date.AddDays(1))
{
    context.BlockedDates.Add(new BlockedDate 
    { 
        ListingId = listingId, 
        Date = date, 
        Reason = "Booked" 
    });
}
```

### Search & Filter (Production)
```csharp
var query = context.Listings
    .Where(l => l.Status == ListingStatus.Published)
    .Where(l => l.City == city)
    .Where(l => l.MaxGuests >= guests)
    .Where(l => l.PricePerNight >= minPrice && l.PricePerNight <= maxPrice);

// Filter by amenities (Production)
if (requiredAmenities.Any())
{
    query = query.Where(l => 
        l.ListingAmenities.Any(la => requiredAmenities.Contains(la.AmenityId)));
}

// Check availability (Production)
query = query.Where(l => !l.BlockedDates.Any(bd => 
    bd.Date >= checkin && bd.Date < checkout));
```

### Review Aggregation
```csharp
// MVP: Simple average
var avgRating = listing.Reviews.Average(r => r.Rating);

// Production: Detailed averages
var stats = new 
{
    Overall = reviews.Average(r => r.Rating),
    Cleanliness = reviews.Average(r => r.CleanlinessRating ?? r.Rating),
    Accuracy = reviews.Average(r => r.AccuracyRating ?? r.Rating),
    Communication = reviews.Average(r => r.CommunicationRating ?? r.Rating),
    Location = reviews.Average(r => r.LocationRating ?? r.Rating),
    CheckIn = reviews.Average(r => r.CheckInRating ?? r.Rating),
    Value = reviews.Average(r => r.ValueRating ?? r.Rating)
};
```

---

## 📊 Database Indexes (Recommended)

```sql
-- Performance indexes
CREATE INDEX IX_Listing_City_Status ON Listings(City, Status);
CREATE INDEX IX_Listing_Price ON Listings(PricePerNight);
CREATE INDEX IX_Booking_Dates ON Bookings(StartDate, EndDate);
CREATE INDEX IX_BlockedDate_Listing_Date ON BlockedDates(ListingId, Date);
CREATE INDEX IX_Review_Listing ON Reviews(ListingId);
```

---

## ✅ Summary

- **Total Tables:** 14 custom + 7 Identity = 21 tables
- **Total Enums:** 5 enums
- **MVP Tables:** 11 tables (skip Amenity, ListingAmenity, BlockedDate for MVP)
- **Nullable Enhanced Fields:** ~25 fields safe to ignore during MVP
- **Zero Breaking Changes:** Add features without migrations

This schema supports both rapid MVP development and production-grade features. Start simple, scale confidently! 🚀
