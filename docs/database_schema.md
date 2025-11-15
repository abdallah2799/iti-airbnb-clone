# Airbnb Clone: MVP Database Schema Guide# Airbnb Clone: MVP Database Schema Guide



> **🎯 MVP Focus:** This document guides you through building the Minimum Viable Product (MVP) using our production-ready database. For complete schema details, see [Production_Database_Schema.md](./Production_Database_Schema.md).> **🎯 MVP Focus:** This document guides you through building the Minimum Viable Product (MVP) using our production-ready database. For complete schema details, see [Production_Database_Schema.md](./Production_Database_Schema.md).



## 📖 What is this?## 📖 What is this?



Our database is **production-ready** but **MVP-friendly**. This means:Our database is **production-ready** but **MVP-friendly**. This means:

- ✅ All tables exist in the database  - ✅ All tables exist in the database

- ✅ Advanced features are **optional** (nullable fields)- ✅ Advanced features are **optional** (nullable fields)

- ✅ You only implement what you need for MVP- ✅ You only implement what you need for MVP

- ✅ No schema changes needed when adding features later- ✅ No schema changes needed when adding features later



**Think of it like a car with all features installed, but you'll only use the basics during MVP (steering, gas, brakes). The AC, GPS, and cruise control are there when you're ready!****Think of it like a car with all features installed, but you'll only use the basics during MVP (steering, gas, brakes). The AC, GPS, and cruise control are there when you're ready!**



------



## 🚦 MVP Development Strategy## 🚦 MVP Development Strategy



### Phase 1: Core MVP (Weeks 1-4)### Phase 1: Core MVP (Weeks 1-4)

**Goal:** Basic Airbnb functionality**Goal:** Basic Airbnb functionality



**Implement These Features:****Implement These Features:**

1. ✅ User Registration & Login1. ✅ User Registration & Login

2. ✅ Host creates listing (basic info only)2. ✅ Host creates listing (basic info only)

3. ✅ Guest searches listings by city3. ✅ Guest searches listings by city

4. ✅ Guest books a listing4. ✅ Guest books a listing

5. ✅ Guest leaves a review (overall rating)5. ✅ Guest leaves a review (overall rating)

6. ✅ Basic messaging between guest and host6. ✅ Basic messaging between guest and host



**Skip These Tables:****Skip These Fields (They're optional!):**

- ❌ Amenity (amenities catalog)- ❌ Cleaning fees, service fees

- ❌ ListingAmenity (amenities filtering)- ❌ Amenities filtering

- ❌ BlockedDate (calendar blocking)- ❌ Check-in/out times

- ❌ Cancellation policies

**Skip These Fields:**- ❌ Host verification badges

- ❌ Cleaning fees, service fees- ❌ Detailed review ratings

- ❌ Check-in/out times- ❌ Calendar blocking

- ❌ Minimum/maximum nights

- ❌ Cancellation policies---

- ❌ Host verification badges

- ❌ Detailed review ratings (6 categories)## 📋 MVP Tables & Fields Guide

- ❌ Payment tracking beyond Stripe ID

### Legend

---| Symbol | Meaning |

|--------|---------|

## 📋 MVP Quick Reference| ✅ **REQUIRED** | Must implement for MVP |

| 🔵 **OPTIONAL** | Nice to have, but skip for MVP |

### Legend| ⏭️ **SKIP** | For future features, ignore completely |

| Symbol | Meaning |

|--------|---------|### ApplicationUser

| ✅ **USE** | Must implement for MVP |- **Inherits from:** AspNetUsers (ASP.NET Core Identity)

| 🔵 **OPTIONAL** | Nice to have, skip for speed |- **Purpose:** Central table for all users (Guests and Hosts). Handles authentication and profile info.

| ⏭️ **SKIP** | For future features, ignore completely |

| Column Name         | Data Type      | Notes                                      |

---|--------------------|---------------|--------------------------------------------|

| Id                 | string (GUID) | Primary Key. Managed by Identity.          |

### 1. ApplicationUser (Users)| Email              | string        | User's email, used for login.              |

**Purpose:** All users - Guests and Hosts| UserName           | string        | User's username, used for login.           |

| PasswordHash       | string        | Hashed password. Managed by Identity.      |

| Field | Status | Why || Bio                | string?       | User's biography. (nullable)               |

|-------|--------|-----|| ProfilePictureUrl  | string?       | URL to profile photo. (nullable)           |

| Email, UserName, Password | ✅ USE | Login required |

| Bio, ProfilePictureUrl | 🔵 OPTIONAL | Nice to have |**Relationships:**

| PhoneNumberVerified, GovernmentIdVerified | ⏭️ SKIP | Verification system (later) |- One-to-Many: Listings (as Host)

| HostResponseRate, HostResponseTimeMinutes | ⏭️ SKIP | Host metrics (later) |- One-to-Many: Bookings (as Guest)

- One-to-Many: Conversations (as Guest/Host)

**MVP Code:**- One-to-Many: Messages (as Sender)

```csharp- Many-to-Many: UserWishlists

// Just basic registration- One-to-Many: Notifications

var user = new ApplicationUser { UserName = email, Email = email };

await userManager.CreateAsync(user, password);---

```

### Listing

---- **Purpose:** Represents a property for rent.



### 2. Listing (Properties)| Column Name         | Data Type      | Notes                                      |

**Purpose:** Properties for rent|--------------------|---------------|--------------------------------------------|

| Id                 | int           | Primary Key                                |

| Field | Status | Why || Title              | string        | Listing title                              |

|-------|--------|-----|| Description        | string        | Full description                           |

| Title, Description, PricePerNight | ✅ USE | Core listing info || PricePerNight      | decimal(18,2) | Price per night                            |

| MaxGuests, Bedrooms, Bathrooms | ✅ USE | Property details || MaxGuests          | int           | Maximum guests allowed                     |

| PropertyType (enum) | ✅ USE | Apartment/House/Villa || NumberOfBedrooms   | int           | Number of bedrooms                         |

| Address, City, Country | ✅ USE | Location & search || NumberOfBathrooms  | int           | Number of bathrooms                        |

| Status (enum) | ✅ USE | Draft or Published || PropertyType       | int (enum)    | Apartment, House, Villa, etc.              |

| HostId | ✅ USE | Who owns it || Address            | string        | Street address                             |

| Latitude, Longitude | 🔵 OPTIONAL | Maps feature || City               | string        | City                                       |

| CleaningFee, ServiceFee | ⏭️ SKIP | Complex pricing || Country            | string        | Country                                    |

| MinimumNights, CheckInTime, etc. | ⏭️ SKIP | Booking rules || Latitude           | double?       | For map integration                        |

| CancellationPolicy | ⏭️ SKIP | Refund system || Longitude          | double?       | For map integration                        |

| HostId             | string (GUID) | FK to ApplicationUser.Id                   |

**MVP Code:**

```csharp**Relationships:**

var listing = new Listing - Many-to-One: Host (ApplicationUser)

{- One-to-Many: Photos

    Title = "Cozy 2BR Apartment",- One-to-Many: Bookings

    Description = "Beautiful apartment in downtown...",- One-to-Many: Reviews

    PricePerNight = 120.00m,- One-to-Many: Conversations

    MaxGuests = 4,- Many-to-Many: UserWishlists

    NumberOfBedrooms = 2,

    NumberOfBathrooms = 1,---

    PropertyType = PropertyType.Apartment,

    Address = "123 Main St",### Photo

    City = "New York",- **Purpose:** Stores URLs for listing images.

    Country = "USA",

    Status = ListingStatus.Published,| Column Name         | Data Type      | Notes                                      |

    HostId = currentUserId|--------------------|---------------|--------------------------------------------|

    // All enhanced fields stay null/default| Id                 | int           | Primary Key                                |

};| Url                | string        | Image URL                                  |

```| IsCover            | bool          | Is main photo for listing card             |

| ListingId          | int           | FK to Listing.Id                           |

---

**Relationships:**

### 3. Photo (Listing Images)- Many-to-One: Listing

**Purpose:** Images for listings

---

| Field | Status | Why |

|-------|--------|-----|### Booking

| Url | ✅ USE | Image URL |- **Purpose:** Records a guest reserving a listing for specific dates.

| IsCover | ✅ USE | Main photo for cards |

| ListingId | ✅ USE | Which listing || Column Name             | Data Type      | Notes                                      |

|------------------------|---------------|--------------------------------------------|

**Business Rule:** Each listing needs at least 1 cover photo.| Id                     | int           | Primary Key                                |

| StartDate              | datetime      | Check-in date                              |

---| EndDate                | datetime      | Check-out date                             |

| TotalPrice             | decimal(18,2) | Total price for stay                       |

### 4. Booking (Reservations)| Guests                 | int           | Number of guests                           |

**Purpose:** Guest bookings| Status                 | int (enum)    | Pending, Confirmed, Cancelled              |

| StripePaymentIntentId  | string        | Stripe payment intent ID                    |

| Field | Status | Why || GuestId                | string (GUID) | FK to ApplicationUser.Id                   |

|-------|--------|-----|| ListingId              | int           | FK to Listing.Id                           |

| StartDate, EndDate | ✅ USE | Check-in/out dates |

| Guests | ✅ USE | Number of guests |**Relationships:**

| TotalPrice | ✅ USE | Amount charged |- Many-to-One: Guest (ApplicationUser)

| Status (enum) | ✅ USE | Pending/Confirmed/Cancelled |- Many-to-One: Listing

| StripePaymentIntentId | ✅ USE | Payment integration |- One-to-One: Review

| GuestId, ListingId | ✅ USE | Who & where |

| CleaningFee, ServiceFee | ⏭️ SKIP | Complex pricing |---

| PaymentStatus (enum) | ⏭️ SKIP | Detailed tracking |

| RefundAmount, CancellationReason | ⏭️ SKIP | Refund system |### Review

- **Purpose:** Stores rating and comment for a completed stay.

**MVP Code:**

```csharp| Column Name         | Data Type      | Notes                                      |

var nights = (checkOut - checkIn).Days;|--------------------|---------------|--------------------------------------------|

var booking = new Booking | Id                 | int           | Primary Key                                |

{| Rating             | int           | Star rating (1-5)                          |

    StartDate = checkIn,| Comment            | string        | Review text                                |

    EndDate = checkOut,| DatePosted         | datetime      | When review was submitted                  |

    Guests = 2,| BookingId          | int           | FK to Booking.Id                           |

    TotalPrice = nights * listing.PricePerNight,| ListingId          | int           | FK to Listing.Id                           |

    Status = BookingStatus.Pending,| GuestId            | string (GUID) | FK to ApplicationUser.Id                   |

    GuestId = currentUserId,

    ListingId = listingId**Relationships:**

};- One-to-One: Booking

```- Many-to-One: Listing

- Many-to-One: Guest (ApplicationUser)

---

---

### 5. Review (Guest Feedback)

**Purpose:** Reviews after stay### Conversation

- **Purpose:** Chat room between Guest and Host about a Listing.

| Field | Status | Why |

|-------|--------|-----|| Column Name         | Data Type      | Notes                                      |

| Rating (1-5) | ✅ USE | Overall rating ||--------------------|---------------|--------------------------------------------|

| Comment | ✅ USE | Review text || Id                 | int           | Primary Key                                |

| DatePosted | ✅ USE | Timestamp || GuestId            | string (GUID) | FK to ApplicationUser.Id (Guest)           |

| BookingId, ListingId, GuestId | ✅ USE | References || HostId             | string (GUID) | FK to ApplicationUser.Id (Host)            |

| CleanlinessRating, AccuracyRating, etc. | ⏭️ SKIP | 6 detailed ratings || ListingId          | int           | FK to Listing.Id                           |



**Business Rule:** Guest can only review after checkout date.**Relationships:**

- Many-to-One: Guest (ApplicationUser)

**MVP Code:**- Many-to-One: Host (ApplicationUser)

```csharp- Many-to-One: Listing

var review = new Review - One-to-Many: Messages

{

    Rating = 5,---

    Comment = "Amazing stay!",

    DatePosted = DateTime.UtcNow,### Message

    BookingId = bookingId,- **Purpose:** Single chat message within a Conversation.

    ListingId = listingId,

    GuestId = currentUserId| Column Name         | Data Type      | Notes                                      |

    // Detailed ratings stay null|--------------------|---------------|--------------------------------------------|

};| Id                 | int           | Primary Key                                |

```| Content            | string        | Message text                               |

| Timestamp          | datetime      | When sent                                  |

---| IsRead             | bool          | If recipient has read                      |

| ConversationId     | int           | FK to Conversation.Id                      |

### 6. Conversation (Chat Rooms)| SenderId           | string (GUID) | FK to ApplicationUser.Id                   |

**Purpose:** Messaging between Guest and Host

**Relationships:**

| Field | Status | Why |- Many-to-One: Conversation

|-------|--------|-----|- Many-to-One: Sender (ApplicationUser)

| GuestId, HostId, ListingId | ✅ USE | Who's chatting about what |

---

**Business Logic:** One conversation per Guest-Host-Listing combo.

### UserWishlist

---- **Purpose:** Join table for Many-to-Many Wishlist feature.



### 7. Message (Chat Messages)| Column Name         | Data Type      | Notes                                      |

**Purpose:** Individual messages|--------------------|---------------|--------------------------------------------|

| ApplicationUserId  | string (GUID) | Composite PK 1, FK to ApplicationUser.Id   |

| Field | Status | Why || ListingId          | int           | Composite PK 2, FK to Listing.Id           |

|-------|--------|-----|

| Content | ✅ USE | Message text |**Relationships:**

| Timestamp | ✅ USE | When sent |- Many-to-Many: ApplicationUser

| IsRead | ✅ USE | Read status |- Many-to-Many: Listing

| ConversationId, SenderId | ✅ USE | Where & who |

---

---

### Notification

### 8. UserWishlist (Favorites)- **Purpose:** Stores a single-line message for a user.

**Purpose:** User saves favorite listings

| Column Name         | Data Type      | Notes                                      |

| Field | Status | Why ||--------------------|---------------|--------------------------------------------|

|-------|--------|-----|| Id                 | int           | Primary Key                                |

| ApplicationUserId, ListingId | ✅ USE | Many-to-many join || Message            | string        | Notification text                          |

| IsRead             | bool          | If user has seen it                        |

**Simple favorite/unfavorite functionality.**| Timestamp          | datetime      | When created                               |

| LinkUrl            | string?       | Optional URL to navigate                   |

---| UserId             | string (GUID) | FK to ApplicationUser.Id                   |



### 9. Notification (Alerts)**Relationships:**

**Purpose:** User notifications- Many-to-One: User (ApplicationUser)



| Field | Status | Why |---

|-------|--------|-----|

| Message | ✅ USE | Notification text |## Enums (Lookup Values)

| IsRead | ✅ USE | Read status |

| Timestamp | ✅ USE | When created |### PropertyType

| UserId | ✅ USE | For which user || Value | Name      |

| LinkUrl | 🔵 OPTIONAL | Navigation link ||-------|-----------|

| 0     | Apartment |

**Examples:**| 1     | House     |

- "Your booking is confirmed!"| 2     | Villa     |

- "You received a 5-star review"| 3     | Cabin     |

| 4     | Room      |

---

### BookingStatus

### ⏭️ SKIP for MVP| Value | Name      | Description                  |

|-------|-----------|------------------------------|

These tables exist but **ignore them for MVP**:| 0     | Pending   | Awaiting host confirmation   |

- **Amenity** - Amenities catalog (WiFi, Pool, etc.)| 1     | Confirmed | Payment successful           |

- **ListingAmenity** - Amenity filtering| 2     | Cancelled | Cancelled by guest or host   |

- **BlockedDate** - Calendar blocking system

---

---

## Relationships Diagram (Textual)

## 🎯 MVP Business Flows

- **ApplicationUser**

### User Registration Flow	- 1:N Listings (as Host)

```csharp	- 1:N Bookings (as Guest)

// 1. Register	- 1:N Conversations (as Guest/Host)

var user = new ApplicationUser { UserName = email, Email = email };	- 1:N Messages (as Sender)

await userManager.CreateAsync(user, password);	- M:N UserWishlists

	- 1:N Notifications

// 2. Login- **Listing**

await signInManager.PasswordSignInAsync(email, password, false, false);	- N:1 Host (ApplicationUser)

```	- 1:N Photos

	- 1:N Bookings

### Create Listing Flow	- 1:N Reviews

```csharp	- 1:N Conversations

// 1. Host creates listing	- M:N UserWishlists

var listing = new Listing { /* core fields only */ };- **Booking**

await context.Listings.AddAsync(listing);	- N:1 Guest (ApplicationUser)

	- N:1 Listing

// 2. Upload photos	- 1:1 Review

var photo = new Photo - **Review**

{ 	- 1:1 Booking

    Url = "/uploads/photo.jpg", 	- N:1 Listing

    IsCover = true, 	- N:1 Guest (ApplicationUser)

    ListingId = listing.Id - **Conversation**

};	- N:1 Guest (ApplicationUser)

await context.Photos.AddAsync(photo);	- N:1 Host (ApplicationUser)

```	- N:1 Listing

	- 1:N Messages

### Booking Flow- **Message**

```csharp	- N:1 Conversation

// 1. Check if dates available	- N:1 Sender (ApplicationUser)

var isBooked = context.Bookings.Any(b => - **UserWishlist**

    b.ListingId == listingId &&	- M:N ApplicationUser

    b.Status == BookingStatus.Confirmed &&	- M:N Listing

    b.StartDate < checkOut && b.EndDate > checkIn);- **Notification**

	- N:1 User (ApplicationUser)

if (isBooked) return "Dates unavailable";

---

// 2. Calculate price

var nights = (checkOut - checkIn).Days;## EF Core Implementation

var total = nights * listing.PricePerNight;

See the `ApplicationDbContext` and entity classes in the backend for the full code implementation.
// 3. Create booking
var booking = new Booking { /* ... */ Status = BookingStatus.Pending };
await context.Bookings.AddAsync(booking);

// 4. Process payment with Stripe
var paymentIntent = await stripe.CreatePaymentIntent(total);
booking.StripePaymentIntentId = paymentIntent.Id;
booking.Status = BookingStatus.Confirmed;
await context.SaveChangesAsync();
```

### Review Flow
```csharp
// 1. Check if booking is completed
if (booking.EndDate > DateTime.UtcNow)
    return "Cannot review before checkout";

// 2. Check if already reviewed
if (context.Reviews.Any(r => r.BookingId == bookingId))
    return "Already reviewed";

// 3. Create review
var review = new Review { /* ... */ };
await context.Reviews.AddAsync(review);
```

### Search Flow
```csharp
// Simple MVP search
var listings = context.Listings
    .Where(l => l.Status == ListingStatus.Published)
    .Where(l => l.City.Contains(searchCity))
    .Where(l => l.MaxGuests >= guests)
    .Include(l => l.Photos)
    .Include(l => l.Host)
    .ToListAsync();
```

---

## 📊 Enums Reference

### PropertyType
```csharp
Apartment = 0
House = 1
Villa = 2
Cabin = 3
Room = 4
```

### BookingStatus
```csharp
Pending = 0      // Awaiting confirmation
Confirmed = 1    // Payment successful
Cancelled = 2    // Cancelled by guest/host
```

### ListingStatus
```csharp
Draft = 0        // Not published
Published = 1    // Visible and bookable
Inactive = 2     // ⏭️ Skip for MVP
Suspended = 3    // ⏭️ Skip for MVP
```

---

## ✅ MVP Checklist

**Week 1-2: User & Listings**
- [ ] User registration & login
- [ ] Create listing (core fields only)
- [ ] Upload photos
- [ ] View listing details
- [ ] Search by city

**Week 3: Bookings**
- [ ] Book a listing
- [ ] Stripe payment integration
- [ ] View my bookings (guest)
- [ ] View bookings for my listings (host)

**Week 4: Reviews & Messaging**
- [ ] Leave review after stay
- [ ] View listing reviews
- [ ] Send message to host
- [ ] Basic messaging UI

**After MVP:**
- [ ] Add amenities filtering
- [ ] Add cleaning fees
- [ ] Add check-in/out times
- [ ] Add calendar blocking
- [ ] Add detailed review ratings
- [ ] Add cancellation policies
- [ ] Add host verification badges

---

## 🚀 Ready to Start!

1. ✅ Database is already created (production-ready)
2. ✅ All entities exist in code
3. ✅ Enhanced fields are optional (nullable)
4. ✅ Focus on fields marked with ✅ USE
5. ✅ Ignore fields marked with ⏭️ SKIP

**Start building your MVP with confidence!** When you're ready for advanced features, just start using the nullable fields - no migrations needed! 🎉

---

For complete technical details, entity relationships, and production features, see **[Production_Database_Schema.md](./Production_Database_Schema.md)**.
