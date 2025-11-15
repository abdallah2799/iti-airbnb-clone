# Software Requirements Specification (SRS)
## ITI Airbnb Clone Platform

**Version:** 1.0  
**Date:** November 15, 2025  
**Project:** ITI Full Stack .NET Graduation Project

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features and Requirements](#3-system-features-and-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [Appendices](#7-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the ITI Airbnb Clone platform. It describes the functional and non-functional requirements for the system, intended for developers, project managers, testers, and stakeholders involved in the project.

### 1.2 Scope

The ITI Airbnb Clone is a web-based property rental platform that enables property owners (Hosts) to list their properties and guests to search, book, and review accommodations. The system facilitates:

- **User Management:** Registration, authentication, and profile management
- **Property Listings:** Creation, management, and browsing of rental properties
- **Booking System:** Reservation management with integrated payment processing
- **Communication:** Real-time messaging between hosts and guests
- **Review System:** Post-stay ratings and reviews
- **Search & Discovery:** Advanced filtering and map-based property search

**In Scope:**
- Web application (Angular frontend + ASP.NET Core backend)
- User authentication (Email/Password and Google OAuth)
- Listing management (CRUD operations)
- Payment processing via Stripe
- Real-time chat via SignalR
- Email notifications
- Review and rating system
- Admin dashboard (optional)

**Out of Scope:**
- Mobile native applications (iOS/Android)
- Host verification process
- Insurance or damage protection
- Multi-language support
- Calendar synchronization with external platforms

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| DoD | Definition of Done |
| DoR | Definition of Ready |
| EF Core | Entity Framework Core |
| GWT | Given-When-Then (acceptance criteria format) |
| Host | A user who lists properties for rent |
| Guest | A user who books properties |
| JWT | JSON Web Token |
| MoSCoW | Must have, Should have, Could have, Won't have (prioritization) |
| OAuth | Open Authorization |
| SPA | Single Page Application |
| SignalR | Real-time communication library for ASP.NET |
| SRS | Software Requirements Specification |
| UI/UX | User Interface/User Experience |

### 1.4 References

- ASP.NET Core Documentation: https://docs.microsoft.com/aspnet/core
- Angular Documentation: https://angular.io/docs
- Stripe API Documentation: https://stripe.com/docs/api
- SignalR Documentation: https://docs.microsoft.com/aspnet/core/signalr

### 1.5 Overview

This document is organized into seven main sections:
- **Section 2** provides an overall description of the system
- **Section 3** details functional requirements organized by feature
- **Section 4** describes external interfaces (UI, API, hardware, software)
- **Section 5** outlines non-functional requirements (performance, security, etc.)
- **Section 6** covers data requirements and database schema
- **Section 7** includes appendices with additional information

---

## 2. Overall Description

### 2.1 Product Perspective

The ITI Airbnb Clone is a standalone web application inspired by Airbnb's core functionality. It consists of:

- **Frontend:** Single Page Application built with Angular 17+
- **Backend:** RESTful API built with ASP.NET Core 9.0
- **Database:** SQL Server with Entity Framework Core ORM
- **External Services:**
  - Stripe for payment processing
  - SendGrid/MailKit for email services
  - Cloudinary or Azure Blob Storage for image hosting
  - Google OAuth for authentication

### 2.2 Product Functions

The primary functions of the system include:

1. **Authentication & Authorization**
   - User registration and login (email/password)
   - OAuth integration (Google)
   - Password reset functionality
   - JWT-based authentication

2. **Listing Management**
   - Create, read, update, delete property listings
   - Upload multiple photos per listing
   - Categorize properties by type (apartment, house, villa, etc.)

3. **Search & Discovery**
   - Search listings by location (city/country)
   - Filter by dates, guest count, property type
   - View listings on interactive map
   - Browse property details

4. **Booking & Payment**
   - Select dates and guest count
   - Secure payment via Stripe Checkout
   - Booking confirmation emails
   - View booking history

5. **Communication**
   - Real-time chat between guests and hosts
   - Conversation history
   - Message notifications

6. **Reviews & Ratings**
   - Leave reviews after completed stays
   - View average ratings and reviews per listing
   - Star-based rating system (1-5)

7. **User Profiles**
   - Edit bio and profile picture
   - View booking/reservation dashboards

8. **Admin Features** (Optional)
   - Manage users, listings, and bookings
   - Platform statistics dashboard

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Expertise | Frequency of Use |
|------------|-------------|---------------------|------------------|
| **Guest** | Users who search and book properties | Low to Medium | Occasional to Frequent |
| **Host** | Users who list and manage properties | Medium | Regular |
| **Admin** | Platform administrators | High | Daily |
| **Anonymous User** | Visitors browsing the site | Low | Variable |

### 2.4 Operating Environment

**Client-Side:**
- Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Minimum screen resolution: 1024x768 (responsive design for mobile)
- JavaScript enabled

**Server-Side:**
- Operating System: Windows Server 2019+ or Linux (Ubuntu 20.04+)
- Web Server: Kestrel (built-in) or IIS
- Database Server: SQL Server 2019+ or Azure SQL Database
- .NET Runtime: .NET 9.0 or higher

**Third-Party Services:**
- Stripe (Payment processing)
- SendGrid or MailKit (Email delivery)
- Cloudinary or Azure Blob Storage (Image hosting)
- Google OAuth (Authentication)

### 2.5 Design and Implementation Constraints

- **Technology Stack:** Must use ASP.NET Core 9.0 and Angular 17+
- **Database:** Must use SQL Server with EF Core
- **Authentication:** Must implement JWT-based authentication
- **Payment:** Must use Stripe for payment processing
- **Security:** Must follow OWASP security best practices
- **Deployment:** Must be deployable to Azure or AWS
- **Budget:** Limited to free tiers of third-party services

### 2.6 Assumptions and Dependencies

**Assumptions:**
- Users have reliable internet connectivity
- Users have valid email addresses
- Property listings include accurate information
- Hosts have legal rights to rent their properties
- Users agree to terms of service

**Dependencies:**
- Availability of Stripe payment gateway
- Availability of Google OAuth services
- Availability of email service provider
- Availability of image hosting service
- SQL Server database availability

---

## 3. System Features and Requirements

### 3.1 User Authentication and Authorization

**Priority:** Must Have  
**Description:** Users must be able to register, log in, and manage their accounts securely.

#### 3.1.1 User Registration (Email/Password)

**FR-AUTH-001:** The system shall allow new users to register with email and password.

**Acceptance Criteria:**
- Given I am on the register page
- When I fill in name, email, and valid password (min 8 characters, 1 uppercase, 1 number)
- And I click "Register"
- Then my account is created in the database
- And I receive a JWT token
- And I am redirected to the homepage

**Priority:** Must Have

---

#### 3.1.2 User Registration (Google OAuth)

**FR-AUTH-002:** The system shall allow new users to register using their Google account.

**Acceptance Criteria:**
- Given I am on the register page
- When I click "Register with Google"
- And I complete Google authentication
- Then a new account is created using my Google email
- And I receive a JWT token
- And I am redirected to the homepage

**Priority:** Must Have

---

#### 3.1.3 User Login (Email/Password)

**FR-AUTH-003:** The system shall allow existing users to log in with email and password.

**Acceptance Criteria:**
- Given I am on the login page
- When I enter my correct email and password
- And I click "Login"
- Then I am authenticated and receive a JWT token
- And I am redirected to the homepage

**Priority:** Must Have

---

#### 3.1.4 User Login (Google OAuth)

**FR-AUTH-004:** The system shall allow existing users to log in using their Google account.

**Acceptance Criteria:**
- Given I am on the login page
- When I click "Login with Google"
- And I complete Google authentication
- Then I am authenticated and receive a JWT token
- And I am redirected to the homepage

**Priority:** Must Have

---

#### 3.1.5 Forgot Password

**FR-AUTH-005:** The system shall allow users to request a password reset link via email.

**Acceptance Criteria:**
- Given I am on the "Forgot Password" page
- When I enter my registered email
- And I click "Send Reset Link"
- Then the system generates a unique password reset token
- And sends an email with a reset link
- And I see a confirmation message

**Priority:** Must Have

---

#### 3.1.6 Reset Password

**FR-AUTH-006:** The system shall allow users to reset their password using the emailed link.

**Acceptance Criteria:**
- Given I have clicked the reset link from my email
- When I enter a new valid password
- And I confirm the password
- And I click "Reset Password"
- Then my password is changed in the database
- And I am redirected to login with a success message

**Priority:** Must Have

---

#### 3.1.7 Change Password (Logged-In)

**FR-AUTH-007:** The system shall allow logged-in users to change their password.

**Acceptance Criteria:**
- Given I am logged in and on "Account Settings"
- When I enter my current password
- And I enter a new valid password
- And I click "Change Password"
- Then the system validates my old password
- And updates my password
- And I see a success message

**Priority:** Must Have

---

#### 3.1.8 Session Management

**FR-AUTH-008:** The system shall maintain user sessions using JWT tokens.

**Acceptance Criteria:**
- JWT tokens shall expire after 24 hours
- The system shall validate JWT on every protected API call
- The system shall return 401 Unauthorized for invalid/expired tokens
- Users shall be logged out upon token expiration

**Priority:** Must Have

---

### 3.2 Listing Management

**Priority:** Must Have  
**Description:** Hosts must be able to create, view, update, and delete property listings.

#### 3.2.1 Create Listing

**FR-LIST-001:** The system shall allow authenticated hosts to create new property listings.

**Acceptance Criteria:**
- Given I am a logged-in host
- When I fill in the listing form (title, description, price, city, country, max guests, bedrooms, bathrooms, property type, address)
- And I click "Submit"
- Then a new listing is created in the database
- And the listing is associated with my user ID as host
- And I see a success message

**Priority:** Must Have

---

#### 3.2.2 Upload Listing Photos

**FR-LIST-002:** The system shall allow hosts to upload multiple photos for their listing.

**Acceptance Criteria:**
- Given I am editing my listing
- When I select multiple image files (max 10, max 5MB each)
- And I click "Upload"
- Then the images are uploaded to cloud storage
- And photo URLs are saved in the database
- And I can designate one photo as the cover photo

**Priority:** Must Have

---

#### 3.2.3 View All Listings

**FR-LIST-003:** The system shall display all active listings on the homepage.

**Acceptance Criteria:**
- Given I am on the homepage
- When the page loads
- Then I see a grid of all listings
- And each listing card shows: cover photo, title, price per night, city, country
- And listings are paginated (20 per page)

**Priority:** Must Have

---

#### 3.2.4 View Single Listing Details

**FR-LIST-004:** The system shall display detailed information for a single listing.

**Acceptance Criteria:**
- Given I am viewing a listing card
- When I click on it
- Then I am taken to the listing detail page
- And I see: all photos, title, description, price, location, max guests, bedrooms, bathrooms, property type, reviews, map location

**Priority:** Must Have

---

#### 3.2.5 Update Listing

**FR-LIST-005:** The system shall allow hosts to update their listing details.

**Acceptance Criteria:**
- Given I am the host of a listing
- When I edit any field and click "Save Changes"
- Then the listing is updated in the database
- And I see a success message

**Priority:** Must Have

---

#### 3.2.6 Delete Listing

**FR-LIST-006:** The system shall allow hosts to delete their listings.

**Acceptance Criteria:**
- Given I am the host of a listing
- When I click "Delete Listing" and confirm
- Then the listing is removed from the database
- And associated photos are deleted from cloud storage
- And I am redirected to my listings page

**Priority:** Must Have

---

### 3.3 Search and Discovery

**Priority:** Must Have / Should Have  
**Description:** Users must be able to search and filter listings to find suitable accommodations.

#### 3.3.1 Search by Location

**FR-SEARCH-001:** The system shall allow users to search listings by city or country.

**Acceptance Criteria:**
- Given I am on the homepage
- When I enter "Alexandria" in the search bar
- And I click "Search"
- Then I see only listings where city or country matches "Alexandria"

**Priority:** Must Have

---

#### 3.3.2 Search by Available Dates

**FR-SEARCH-002:** The system shall allow users to filter listings by available dates.

**Acceptance Criteria:**
- Given I am on the homepage
- When I select check-in and check-out dates
- And I click "Search"
- Then I see only listings with no conflicting bookings for those dates

**Priority:** Should Have

---

#### 3.3.3 Filter by Guest Count

**FR-SEARCH-003:** The system shall allow users to filter listings by number of guests.

**Acceptance Criteria:**
- Given I am on the search results page
- When I select "4 guests" from the filter
- Then I see only listings where max guests >= 4

**Priority:** Should Have

---

#### 3.3.4 View Listings on Map

**FR-SEARCH-004:** The system shall display listings on an interactive map.

**Acceptance Criteria:**
- Given I am on the homepage or search results
- When the page loads
- Then I see a map with pins for each listing
- And when I click a pin, I see a popup with listing info
- And when I click the popup, I navigate to the listing detail page

**Priority:** Should Have

---

### 3.4 Booking and Payment

**Priority:** Must Have  
**Description:** Users must be able to book properties and pay securely.

#### 3.4.1 Create Booking

**FR-BOOK-001:** The system shall allow guests to book available listings.

**Acceptance Criteria:**
- Given I am viewing a listing detail page
- When I select valid dates and guest count
- And I click "Reserve"
- Then I am taken to a "Confirm and Pay" page
- And I see: listing summary, dates, guests, total price calculation

**Priority:** Must Have

---

#### 3.4.2 Process Payment

**FR-BOOK-002:** The system shall process payments securely via Stripe.

**Acceptance Criteria:**
- Given I am on the "Confirm and Pay" page
- When I click "Pay"
- Then I am redirected to Stripe Checkout
- And after successful payment, I am redirected to "Booking Confirmed" page
- And a booking record is created in the database with status "Confirmed"
- And the booking includes the Stripe payment intent ID

**Priority:** Must Have

---

#### 3.4.3 Booking Confirmation Email

**FR-BOOK-003:** The system shall send a confirmation email after successful booking.

**Acceptance Criteria:**
- Given my payment was successful
- When the booking is created
- Then I receive an email containing: listing name, dates, guest count, total price, host contact info

**Priority:** Must Have

---

#### 3.4.4 View My Bookings

**FR-BOOK-004:** The system shall allow guests to view their booking history.

**Acceptance Criteria:**
- Given I am a logged-in guest
- When I navigate to "My Bookings"
- Then I see a list of all my bookings (past and upcoming)
- And each booking shows: listing info, dates, status, total price

**Priority:** Should Have

---

#### 3.4.5 View My Reservations

**FR-BOOK-005:** The system shall allow hosts to view reservations for their listings.

**Acceptance Criteria:**
- Given I am a logged-in host
- When I navigate to "My Reservations"
- Then I see all bookings for all my listings
- And each booking shows: guest info, listing, dates, status

**Priority:** Should Have

---

### 3.5 Communication

**Priority:** Must Have  
**Description:** Users must be able to communicate in real-time.

#### 3.5.1 Initiate Conversation

**FR-COMM-001:** The system shall allow guests to contact hosts from listing pages.

**Acceptance Criteria:**
- Given I am viewing a listing detail page
- When I click "Contact Host"
- Then a new conversation is created (if not exists)
- And I am taken to the chat interface

**Priority:** Must Have

---

#### 3.5.2 Send Messages

**FR-COMM-002:** The system shall allow users to send real-time messages.

**Acceptance Criteria:**
- Given I am in a chat window
- When I type a message and press "Send"
- Then my message instantly appears in the chat
- And the message is saved to the database
- And the other user (if online) instantly sees the message

**Priority:** Must Have

---

#### 3.5.3 View Conversation History

**FR-COMM-003:** The system shall display past conversation history.

**Acceptance Criteria:**
- Given I am logged in
- When I navigate to "My Messages"
- Then I see a list of all my conversations
- And when I open a conversation, I see all past messages with timestamps

**Priority:** Must Have

---

#### 3.5.4 Mark Messages as Read

**FR-COMM-004:** The system shall track message read status.

**Acceptance Criteria:**
- When I view a conversation
- Then all unread messages are marked as read
- And the sender can see that messages have been read

**Priority:** Should Have

---

### 3.6 Reviews and Ratings

**Priority:** Should Have  
**Description:** Users should be able to leave and view reviews after completed stays.

#### 3.6.1 Leave Review

**FR-REV-001:** The system shall allow guests to review completed bookings.

**Acceptance Criteria:**
- Given I have a completed booking (check-out date has passed)
- When I navigate to "My Bookings"
- Then I see a "Leave Review" button for that booking
- And when I submit a review (rating 1-5, comment), it is saved
- And the review is linked to the booking, listing, and my user ID

**Priority:** Should Have

---

#### 3.6.2 View Listing Reviews

**FR-REV-002:** The system shall display reviews on listing detail pages.

**Acceptance Criteria:**
- Given I am viewing a listing detail page
- When the page loads
- Then I see the average star rating
- And I see all reviews with: rating, comment, guest name, date posted
- And reviews are sorted by most recent first

**Priority:** Should Have

---

#### 3.6.3 Prevent Duplicate Reviews

**FR-REV-003:** The system shall prevent multiple reviews per booking.

**Acceptance Criteria:**
- Given I have already reviewed a booking
- When I try to review it again
- Then the system prevents the duplicate review
- And I see a message "You have already reviewed this stay"

**Priority:** Should Have

---

### 3.7 User Profile Management

**Priority:** Should Have  
**Description:** Users should be able to manage their profiles.

#### 3.7.1 Edit Profile

**FR-PROF-001:** The system shall allow users to edit their profile information.

**Acceptance Criteria:**
- Given I am logged in
- When I navigate to "My Profile"
- And I update my bio and/or upload a profile picture
- And I click "Save"
- Then my profile is updated in the database

**Priority:** Should Have

---

#### 3.7.2 View User Profile

**FR-PROF-002:** The system shall display user profiles.

**Acceptance Criteria:**
- Given I am viewing a listing or review
- When I click on a username
- Then I see that user's profile page showing: profile picture, bio, join date

**Priority:** Should Have

---

### 3.8 Wishlist

**Priority:** Could Have  
**Description:** Users could save favorite listings for later viewing.

#### 3.8.1 Add to Wishlist

**FR-WISH-001:** The system shall allow users to save listings to a wishlist.

**Acceptance Criteria:**
- Given I am viewing a listing
- When I click the heart icon
- Then the listing is added to my wishlist
- And the heart icon changes to indicate it's saved

**Priority:** Could Have

---

#### 3.8.2 View Wishlist

**FR-WISH-002:** The system shall display saved listings.

**Acceptance Criteria:**
- Given I am logged in
- When I navigate to "My Wishlist"
- Then I see all listings I have saved

**Priority:** Could Have

---

### 3.9 Admin Dashboard

**Priority:** Could Have  
**Description:** Administrators could manage platform content and users.

#### 3.9.1 View Platform Statistics

**FR-ADMIN-001:** The system shall display platform statistics to admins.

**Acceptance Criteria:**
- Given I am logged in as an admin
- When I navigate to the admin dashboard
- Then I see: total users, total listings, total bookings, revenue statistics

**Priority:** Could Have

---

#### 3.9.2 Manage Listings

**FR-ADMIN-002:** The system shall allow admins to manage any listing.

**Acceptance Criteria:**
- Given I am logged in as an admin
- When I view any listing
- Then I can edit or delete it
- And actions are logged for audit purposes

**Priority:** Could Have

---

### 3.10 Notifications

**Priority:** Could Have  
**Description:** Users could receive real-time notifications.

#### 3.10.1 Receive Notifications

**FR-NOTIF-001:** The system shall send real-time notifications for important events.

**Acceptance Criteria:**
- Given I am logged in
- When I receive a new message or booking
- Then I see a notification popup
- And the notification is saved in the database
- And I can click to navigate to the relevant page

**Priority:** Could Have

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements

- **UI-001:** The UI shall be responsive and work on desktop (1920x1080), tablet (768x1024), and mobile (375x667) devices
- **UI-002:** The UI shall follow modern design principles with clean, intuitive navigation
- **UI-003:** The UI shall use a consistent color scheme and typography throughout
- **UI-004:** The UI shall provide visual feedback for user actions (loading spinners, success messages, error messages)
- **UI-005:** The UI shall be accessible (WCAG 2.1 Level AA compliance where possible)

#### 4.1.2 Key Pages

1. **Homepage**
   - Search bar (location, dates, guests)
   - Grid of listing cards
   - Filter panel
   - Map view toggle

2. **Listing Detail Page**
   - Photo gallery
   - Property information
   - Booking widget
   - Reviews section
   - Host profile
   - Location map

3. **User Authentication Pages**
   - Registration form
   - Login form
   - Forgot password form
   - Reset password form

4. **User Dashboard**
   - My Bookings (for guests)
   - My Reservations (for hosts)
   - My Listings (for hosts)
   - My Messages
   - My Profile
   - My Wishlist

5. **Booking Flow**
   - Confirm and Pay page
   - Booking confirmation page

6. **Messaging Interface**
   - Conversation list
   - Chat window with real-time updates

7. **Admin Dashboard** (optional)
   - Statistics overview
   - User management
   - Listing management
   - Booking management

### 4.2 Hardware Interfaces

Not applicable. The system is a web-based application with no direct hardware interfaces.

### 4.3 Software Interfaces

#### 4.3.1 Database Interface

- **Database:** SQL Server 2019+
- **ORM:** Entity Framework Core 9.0
- **Connection:** ADO.NET with connection pooling
- **Migration:** EF Core Migrations for schema management

#### 4.3.2 External Services

1. **Stripe Payment Gateway**
   - **API Version:** 2023-10-16 or later
   - **Integration Method:** Stripe Checkout Session
   - **Webhook:** stripe-webhook endpoint for payment confirmation

2. **Email Service (SendGrid or MailKit)**
   - **SendGrid API:** v3
   - **Purpose:** Send transactional emails (registration, password reset, booking confirmations)
   - **Authentication:** API Key

3. **Image Hosting (Cloudinary or Azure Blob Storage)**
   - **Purpose:** Store and serve listing photos and profile pictures
   - **Format:** JPEG, PNG (max 5MB per file)
   - **CDN:** Automatic CDN delivery

4. **Google OAuth 2.0**
   - **Purpose:** Social authentication
   - **Scopes:** email, profile
   - **Integration:** ASP.NET Core external authentication

### 4.4 Communication Interfaces

#### 4.4.1 HTTP/HTTPS

- **Protocol:** HTTPS (TLS 1.2+)
- **API Format:** RESTful JSON
- **Port:** 443 (production), 5001 (development)

#### 4.4.2 WebSocket (SignalR)

- **Protocol:** WebSocket (with fallback to Server-Sent Events, Long Polling)
- **Purpose:** Real-time messaging
- **Library:** ASP.NET Core SignalR

#### 4.4.3 API Endpoints

All API endpoints shall follow RESTful conventions:

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| /api/auth/register | - | Register user | - | - |
| /api/auth/login | - | Login user | - | - |
| /api/listings | Get all listings | Create listing | - | - |
| /api/listings/{id} | Get listing by ID | - | Update listing | Delete listing |
| /api/bookings | Get user bookings | Create booking | - | - |
| /api/bookings/{id} | Get booking by ID | - | - | Cancel booking |
| /api/reviews | Get reviews | Create review | - | - |
| /api/conversations | Get user conversations | Create conversation | - | - |
| /api/messages | Get messages | Send message | - | - |
| /api/profile | Get user profile | - | Update profile | - |
| /api/wishlist | Get wishlist | Add to wishlist | - | Remove from wishlist |

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

- **PERF-001:** The homepage shall load within 2 seconds on a standard broadband connection (5 Mbps)
- **PERF-002:** API response time shall not exceed 500ms for 95% of requests
- **PERF-003:** The system shall support at least 1000 concurrent users
- **PERF-004:** Database queries shall be optimized with appropriate indexes
- **PERF-005:** Images shall be optimized and served via CDN
- **PERF-006:** Real-time messages shall be delivered within 1 second

### 5.2 Security Requirements

- **SEC-001:** All passwords shall be hashed using industry-standard algorithms (bcrypt or PBKDF2)
- **SEC-002:** JWT tokens shall be signed with a secret key and include expiration time
- **SEC-003:** All sensitive data transmission shall use HTTPS
- **SEC-004:** The system shall implement protection against common vulnerabilities (SQL injection, XSS, CSRF)
- **SEC-005:** API endpoints shall implement proper authorization (users can only access their own data)
- **SEC-006:** Stripe payment processing shall be PCI-DSS compliant (handled by Stripe)
- **SEC-007:** User input shall be validated and sanitized on both client and server
- **SEC-008:** The system shall implement rate limiting to prevent abuse
- **SEC-009:** Sensitive configuration (API keys) shall be stored in environment variables or secure vaults

### 5.3 Reliability Requirements

- **REL-001:** The system shall have 99.5% uptime (excluding scheduled maintenance)
- **REL-002:** The system shall implement error logging and monitoring
- **REL-003:** The system shall handle database connection failures gracefully with retry logic
- **REL-004:** Failed payment transactions shall not create booking records
- **REL-005:** The system shall implement data backup daily

### 5.4 Availability Requirements

- **AVAIL-001:** The system shall be available 24/7 with scheduled maintenance windows
- **AVAIL-002:** Scheduled maintenance shall be announced 48 hours in advance
- **AVAIL-003:** The system shall implement health check endpoints for monitoring

### 5.5 Maintainability Requirements

- **MAINT-001:** Code shall follow SOLID principles and clean architecture
- **MAINT-002:** Code shall be documented with XML comments for public APIs
- **MAINT-003:** The system shall use dependency injection for loose coupling
- **MAINT-004:** The codebase shall maintain at least 70% unit test coverage
- **MAINT-005:** Database schema changes shall use EF Core migrations

### 5.6 Portability Requirements

- **PORT-001:** The backend shall be deployable on Windows and Linux servers
- **PORT-002:** The system shall be containerizable using Docker
- **PORT-003:** The system shall be deployable to Azure, AWS, or on-premises environments

### 5.7 Scalability Requirements

- **SCALE-001:** The system architecture shall support horizontal scaling
- **SCALE-002:** The database shall support connection pooling
- **SCALE-003:** Static assets shall be served via CDN
- **SCALE-004:** The system shall implement caching where appropriate (Redis optional)

### 5.8 Usability Requirements

- **USAB-001:** New users shall be able to complete a booking within 5 minutes
- **USAB-002:** The UI shall provide helpful error messages for invalid inputs
- **USAB-003:** The system shall provide tooltips and help text where needed
- **USAB-004:** The system shall support keyboard navigation
- **USAB-005:** Forms shall implement client-side validation with immediate feedback

### 5.9 Compatibility Requirements

- **COMPAT-001:** The frontend shall support the latest 2 versions of Chrome, Firefox, Safari, and Edge
- **COMPAT-002:** The system shall degrade gracefully for unsupported browsers
- **COMPAT-003:** The backend API shall use standard HTTP methods and status codes

---

## 6. Data Requirements

### 6.1 Database Schema

The system uses a relational database with the following main entities. For detailed schema information, refer to `database_schema.md`.

#### 6.1.1 Core Entities

1. **ApplicationUser** (extends ASP.NET Identity)
   - Authentication and user profile data
   - Properties: Id, Email, Username, PasswordHash, Bio, ProfilePictureUrl

2. **Listing**
   - Property information
   - Properties: Id, Title, Description, PricePerNight, MaxGuests, NumberOfBedrooms, NumberOfBathrooms, PropertyType, Address, City, Country, Latitude, Longitude, HostId

3. **Photo**
   - Listing images
   - Properties: Id, Url, IsCover, ListingId

4. **Booking**
   - Reservation records
   - Properties: Id, StartDate, EndDate, TotalPrice, Guests, Status, StripePaymentIntentId, GuestId, ListingId

5. **Review**
   - Rating and feedback
   - Properties: Id, Rating, Comment, DatePosted, BookingId, ListingId, GuestId

6. **Conversation**
   - Chat sessions
   - Properties: Id, GuestId, HostId, ListingId

7. **Message**
   - Chat messages
   - Properties: Id, Content, Timestamp, IsRead, ConversationId, SenderId

8. **UserWishlist**
   - Saved listings (many-to-many)
   - Properties: ApplicationUserId, ListingId

9. **Notification**
   - User notifications
   - Properties: Id, Message, IsRead, Timestamp, LinkUrl, UserId

### 6.2 Data Retention and Archival

- **User Data:** Retained indefinitely unless user requests deletion (GDPR compliance)
- **Booking Records:** Retained for 7 years for financial/legal reasons
- **Messages:** Retained for 2 years after last activity
- **Review Data:** Retained as long as listing exists
- **Logs:** Retained for 90 days

### 6.3 Data Backup and Recovery

- **Backup Frequency:** Daily full backups at 2:00 AM UTC
- **Backup Retention:** 30 days
- **Recovery Point Objective (RPO):** 24 hours
- **Recovery Time Objective (RTO):** 4 hours

### 6.4 Data Integrity

- **Foreign Key Constraints:** All relationships enforced at database level
- **Cascade Behavior:** 
  - Deleting a user does NOT cascade delete their listings (Restrict)
  - Deleting a listing DOES cascade delete its photos
  - Deleting a booking DOES cascade delete its review
- **Transaction Support:** All critical operations (booking, payment) use database transactions

### 6.5 Data Privacy

- **PII Protection:** Personal data encrypted at rest and in transit
- **GDPR Compliance:** Users can request data export and deletion
- **Payment Data:** No credit card data stored (handled by Stripe)
- **Access Control:** Users can only access their own data (except admins)

---

## 7. Appendices

### 7.1 Glossary

| Term | Definition |
|------|------------|
| Booking | A confirmed reservation for a listing |
| Check-in | The date a guest arrives at the property |
| Check-out | The date a guest leaves the property |
| Conversation | A chat thread between a guest and host |
| Cover Photo | The main image displayed on listing cards |
| Guest | A user who books accommodations |
| Host | A user who lists properties for rent |
| Listing | A property available for rent |
| Property Type | Category of accommodation (apartment, house, etc.) |
| Reservation | Same as booking (from host perspective) |
| Wishlist | A collection of saved listings |

### 7.2 MoSCoW Priority Definitions

- **Must Have (M):** Critical features required for MVP. Project fails without these.
- **Should Have (S):** Important features that add significant value. Should be included if possible.
- **Could Have (C):** Desirable features that enhance the product. Included if time/budget allows.
- **Won't Have:** Features explicitly excluded from this release.

### 7.3 Technology Stack

**Frontend:**
- Framework: Angular 17+
- Language: TypeScript 5.0+
- UI Library: Angular Material (optional) or custom CSS
- State Management: RxJS
- HTTP Client: Angular HttpClient
- Real-time: @microsoft/signalr
- Map: Leaflet with ngx-leaflet

**Backend:**
- Framework: ASP.NET Core 9.0
- Language: C# 12
- ORM: Entity Framework Core 9.0
- Authentication: ASP.NET Core Identity + JWT
- Real-time: SignalR
- API Documentation: Swagger/OpenAPI

**Database:**
- RDBMS: SQL Server 2019+

**Third-Party Services:**
- Payment: Stripe
- Email: SendGrid or MailKit
- Storage: Cloudinary or Azure Blob Storage
- Auth: Google OAuth 2.0

**DevOps:**
- Version Control: Git (GitHub/Azure DevOps)
- CI/CD: GitHub Actions or Azure Pipelines
- Hosting: Azure App Service or AWS Elastic Beanstalk
- Monitoring: Application Insights (optional)

### 7.4 Agile Methodology

The project follows a 14-day sprint-based agile approach:

- **Sprint Duration:** 2 days per sprint (6 sprints total)
- **Sprint Planning:** At the start of each sprint
- **Daily Standups:** 15-minute daily check-ins
- **Sprint Review:** Demonstration at end of each sprint
- **Sprint Retrospective:** Team reflection after each sprint

**Definition of Ready (DoR):** See backlog.md section 1
**Definition of Done (DoD):** See backlog.md section 1

### 7.5 Development Timeline

| Sprint | Days | Focus Area |
|--------|------|------------|
| Sprint 0 | 1-2 | Foundation: Auth, Database, Email |
| Sprint 1 | 3-4 | Listing CRUD & Search |
| Sprint 2 | 5-6 | Payment Integration |
| Sprint 3 | 7-8 | Real-Time Messaging |
| Sprint 4 | 9-10 | Advanced Search & Reviews |
| Sprint 5 | 11-12 | Dashboards & Maps |
| Sprint 6 | 13-14 | Polish & Optional Features |

### 7.6 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-15 | ITI Team | Initial SRS document |

---

**Document End**