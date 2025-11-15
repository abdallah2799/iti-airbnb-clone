# Airbnb Clone: Database Schema

This document describes the complete database schema for the Airbnb Clone project, including tables, columns, relationships, and enums. It is based on the Entity Framework Core implementation and ASP.NET Core Identity.

---

## Table-by-Table Description

### ApplicationUser
- **Inherits from:** AspNetUsers (ASP.NET Core Identity)
- **Purpose:** Central table for all users (Guests and Hosts). Handles authentication and profile info.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | string (GUID) | Primary Key. Managed by Identity.          |
| Email              | string        | User's email, used for login.              |
| UserName           | string        | User's username, used for login.           |
| PasswordHash       | string        | Hashed password. Managed by Identity.      |
| Bio                | string?       | User's biography. (nullable)               |
| ProfilePictureUrl  | string?       | URL to profile photo. (nullable)           |

**Relationships:**
- One-to-Many: Listings (as Host)
- One-to-Many: Bookings (as Guest)
- One-to-Many: Conversations (as Guest/Host)
- One-to-Many: Messages (as Sender)
- Many-to-Many: UserWishlists
- One-to-Many: Notifications

---

### Listing
- **Purpose:** Represents a property for rent.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| Title              | string        | Listing title                              |
| Description        | string        | Full description                           |
| PricePerNight      | decimal(18,2) | Price per night                            |
| MaxGuests          | int           | Maximum guests allowed                     |
| NumberOfBedrooms   | int           | Number of bedrooms                         |
| NumberOfBathrooms  | int           | Number of bathrooms                        |
| PropertyType       | int (enum)    | Apartment, House, Villa, etc.              |
| Address            | string        | Street address                             |
| City               | string        | City                                       |
| Country            | string        | Country                                    |
| Latitude           | double?       | For map integration                        |
| Longitude          | double?       | For map integration                        |
| HostId             | string (GUID) | FK to ApplicationUser.Id                   |

**Relationships:**
- Many-to-One: Host (ApplicationUser)
- One-to-Many: Photos
- One-to-Many: Bookings
- One-to-Many: Reviews
- One-to-Many: Conversations
- Many-to-Many: UserWishlists

---

### Photo
- **Purpose:** Stores URLs for listing images.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| Url                | string        | Image URL                                  |
| IsCover            | bool          | Is main photo for listing card             |
| ListingId          | int           | FK to Listing.Id                           |

**Relationships:**
- Many-to-One: Listing

---

### Booking
- **Purpose:** Records a guest reserving a listing for specific dates.

| Column Name             | Data Type      | Notes                                      |
|------------------------|---------------|--------------------------------------------|
| Id                     | int           | Primary Key                                |
| StartDate              | datetime      | Check-in date                              |
| EndDate                | datetime      | Check-out date                             |
| TotalPrice             | decimal(18,2) | Total price for stay                       |
| Guests                 | int           | Number of guests                           |
| Status                 | int (enum)    | Pending, Confirmed, Cancelled              |
| StripePaymentIntentId  | string        | Stripe payment intent ID                    |
| GuestId                | string (GUID) | FK to ApplicationUser.Id                   |
| ListingId              | int           | FK to Listing.Id                           |

**Relationships:**
- Many-to-One: Guest (ApplicationUser)
- Many-to-One: Listing
- One-to-One: Review

---

### Review
- **Purpose:** Stores rating and comment for a completed stay.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| Rating             | int           | Star rating (1-5)                          |
| Comment            | string        | Review text                                |
| DatePosted         | datetime      | When review was submitted                  |
| BookingId          | int           | FK to Booking.Id                           |
| ListingId          | int           | FK to Listing.Id                           |
| GuestId            | string (GUID) | FK to ApplicationUser.Id                   |

**Relationships:**
- One-to-One: Booking
- Many-to-One: Listing
- Many-to-One: Guest (ApplicationUser)

---

### Conversation
- **Purpose:** Chat room between Guest and Host about a Listing.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| GuestId            | string (GUID) | FK to ApplicationUser.Id (Guest)           |
| HostId             | string (GUID) | FK to ApplicationUser.Id (Host)            |
| ListingId          | int           | FK to Listing.Id                           |

**Relationships:**
- Many-to-One: Guest (ApplicationUser)
- Many-to-One: Host (ApplicationUser)
- Many-to-One: Listing
- One-to-Many: Messages

---

### Message
- **Purpose:** Single chat message within a Conversation.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| Content            | string        | Message text                               |
| Timestamp          | datetime      | When sent                                  |
| IsRead             | bool          | If recipient has read                      |
| ConversationId     | int           | FK to Conversation.Id                      |
| SenderId           | string (GUID) | FK to ApplicationUser.Id                   |

**Relationships:**
- Many-to-One: Conversation
- Many-to-One: Sender (ApplicationUser)

---

### UserWishlist
- **Purpose:** Join table for Many-to-Many Wishlist feature.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| ApplicationUserId  | string (GUID) | Composite PK 1, FK to ApplicationUser.Id   |
| ListingId          | int           | Composite PK 2, FK to Listing.Id           |

**Relationships:**
- Many-to-Many: ApplicationUser
- Many-to-Many: Listing

---

### Notification
- **Purpose:** Stores a single-line message for a user.

| Column Name         | Data Type      | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| Id                 | int           | Primary Key                                |
| Message            | string        | Notification text                          |
| IsRead             | bool          | If user has seen it                        |
| Timestamp          | datetime      | When created                               |
| LinkUrl            | string?       | Optional URL to navigate                   |
| UserId             | string (GUID) | FK to ApplicationUser.Id                   |

**Relationships:**
- Many-to-One: User (ApplicationUser)

---

## Enums (Lookup Values)

### PropertyType
| Value | Name      |
|-------|-----------|
| 0     | Apartment |
| 1     | House     |
| 2     | Villa     |
| 3     | Cabin     |
| 4     | Room      |

### BookingStatus
| Value | Name      | Description                  |
|-------|-----------|------------------------------|
| 0     | Pending   | Awaiting host confirmation   |
| 1     | Confirmed | Payment successful           |
| 2     | Cancelled | Cancelled by guest or host   |

---

## Relationships Diagram (Textual)

- **ApplicationUser**
	- 1:N Listings (as Host)
	- 1:N Bookings (as Guest)
	- 1:N Conversations (as Guest/Host)
	- 1:N Messages (as Sender)
	- M:N UserWishlists
	- 1:N Notifications
- **Listing**
	- N:1 Host (ApplicationUser)
	- 1:N Photos
	- 1:N Bookings
	- 1:N Reviews
	- 1:N Conversations
	- M:N UserWishlists
- **Booking**
	- N:1 Guest (ApplicationUser)
	- N:1 Listing
	- 1:1 Review
- **Review**
	- 1:1 Booking
	- N:1 Listing
	- N:1 Guest (ApplicationUser)
- **Conversation**
	- N:1 Guest (ApplicationUser)
	- N:1 Host (ApplicationUser)
	- N:1 Listing
	- 1:N Messages
- **Message**
	- N:1 Conversation
	- N:1 Sender (ApplicationUser)
- **UserWishlist**
	- M:N ApplicationUser
	- M:N Listing
- **Notification**
	- N:1 User (ApplicationUser)

---

## EF Core Implementation

See the `ApplicationDbContext` and entity classes in the backend for the full code implementation.