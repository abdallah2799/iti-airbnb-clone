# ITI Airbnb Clone - Agile Project Plan & Backlog

This document details the full agile plan, product backlog, and 14-day sprint breakdown for the ITI Airbnb Clone project.

---

## 1. Project Principles

### Definition of Ready (DoR)
A User Story is "Ready" to be started when it meets all these criteria:

- **Story is clear:** Written in the *As a [Role], I want [Action], so that [Benefit]* format.
- **Acceptance Criteria (GWT) are defined:** Written in the *Given-When-Then* format.
- **Dependencies are identified:** Any other story, API, or model that must be completed first is listed.
- **UI is understood:** A reference screenshot from the real Airbnb or a simple wireframe is attached/agreed upon.
- **Story is scoped:** The team agrees the story is small enough to be completed within a single sprint (1-3 days).

### Definition of Done (DoD)
A User Story is "Done" when it meets all these criteria:

- **Code is written:** All required code (C#, Angular, HTML/CSS) is complete.
- **Functionality is tested:** The developer has personally tested and verified all Given-When-Then acceptance criteria.
- **Code is peer-reviewed:** At least one other team member has reviewed the code and approved the merge.
- **Code is merged:** The feature branch is successfully merged into the main or develop branch.
- **No bugs:** The feature introduces no new, high-priority bugs ("breaking bugs").
- **UI is responsive:** The feature looks correct on both desktop and mobile.

---

## 2. Full Product Backlog (MoSCoW)

### 🅼 Must Have (The "Non-Negotiable" Core)

- **[M] Auth:** As a new user, I want to register an account with my email and password.
- **[M] Auth:** As a new user, I want to register using my Google account.
- **[M] Auth:** As an existing user, I want to log in with my email and password.
- **[M] Auth:** As an existing user, I want to log in using my Google account.
- **[M] Auth:** As a user who forgot my password, I want to request a password reset link.
- **[M] Auth:** As a user who received a reset email, I want to set a new password.
- **[M] Auth:** As a logged-in user, I want to update my password.
- **[M] Host:** As a Host, I want to create a new listing.
- **[M] Host:** As a Host, I want to upload multiple photos for my listing.
- **[M] Host:** As a Host, I want to update my listing's details.
- **[M] Host:** As a Host, I want to delete my listing.
- **[M] Guest:** As a Guest, I want to view a homepage grid of all listings.
- **[M] Guest:** As a Guest, I want to view a single listing's details page.
- **[M] Guest:** As a Guest, I want to search for listings by city or country.
- **[M] Guest:** As a Guest, I want to securely pay for a booking (using Stripe).
- **[M] Guest:** As a Guest, I want to receive a confirmation after booking.
- **[M] Guest:** As a Guest, I want to contact a host from a listing page.
- **[M] User:** As a User, I want to send and receive messages in real-time (using SignalR).
- **[M] User:** As a User, I want to see my past conversation history.
- **[M] Developer:** As a Developer, I want to set up a centralized email service for password resets and booking confirmations.

### 🆂 Should Have (The "High-Value" Features)

- **[S] Guest:** As a Guest, I want to search for listings by available dates.
- **[S] Guest:** As a Guest, I want to filter listings by number of guests.
- **[S] Guest:** As a Guest, I want to leave a rating and review for a completed stay.
- **[S] Guest:** As a Guest, I want to see the average rating and all reviews on a listing.
- **[S] Guest:** As a Guest, I want to see listings on an interactive map.
- **[S] User:** As a User, I want to edit my profile (bio, profile picture).
- **[S] Guest:** As a Guest, I want to view a "My Bookings" page.
- **[S] Host:** As a Host, I want to view a "My Reservations" dashboard.

### 🅲 Could Have (The "Polish & Wow" Features)

- **[C] Host:** As a Host, I want AI to help me write my listing description.
- **[C] Admin:** As an Admin, I want a dashboard to view all users, listings, and bookings.
- **[C] Guest:** As a Guest, I want to save listings to a "Wishlist."
- **[C] User:** As a User, I want to receive a real-time notification for new messages or bookings.

---

## 3. 14-Day Sprint Plan & Detailed Stories

### Sprint 0 (Day 1-2): The Foundation
**Goal:** Setup project, database, and authentication.

#### User Stories

##### 1. Story: [M] Register with Email
**As a** new user, **I want to** register an account with my email and password, **so that** I can log in.

**GWT:**
- **Given** I am on the register page
- **When** I fill in my name, email, and a valid password
- **And** I click "Register"
- **Then** my account is created in the database
- **And** I am logged in and given a JWT token

**Tech Hint:** Use ASP.NET Core Identity. Create an `AuthController` with a `[HttpPost("register")]` endpoint. Use `UserManager.CreateAsync()`.

---

##### 2. Story: [M] Register with Google
**As a** new user, **I want to** register using my Google account, **so that** I don't have to create a new password.

**GWT:**
- **Given** I am on the register page
- **When** I click "Register with Google"
- **And** I complete the Google auth pop-up
- **Then** a new user account is created in the database using my Google email
- **And** I am logged in and given a JWT token

**Tech Hint:** Use `Microsoft.AspNetCore.Authentication.Google` in `Program.cs`. Create an external login endpoint that handles the callback from Google, finds or creates a user, and issues a JWT.

---

##### 3. Story: [M] Login with Email
**As an** existing user, **I want to** log in with my email and password, **so that** I can access my account.

**GWT:**
- **Given** I am on the login page
- **When** I enter my correct email and password
- **And** I click "Login"
- **Then** I am authenticated and given a JWT token

**Tech Hint:** Use `SignInManager.PasswordSignInAsync()` in your `AuthController`. If successful, generate and return a JWT.

---

##### 4. Story: [M] Login with Google
**As an** existing user, **I want to** log in using my Google account, **so that** I can access my account quickly.

**GWT:**
- **Given** I am on the login page
- **When** I click "Login with Google"
- **And** I complete the Google auth pop-up
- **Then** the system finds my existing account
- **And** I am authenticated and given a JWT token

**Tech Hint:** The same external login endpoint as registration. It should check `UserManager.FindByLoginAsync()` first, and if the user exists, just issue the JWT.

---

##### 5. Story: [M] Implement Email Service
**As a** Developer, **I want to** set up a centralized email service, **so that** the application can send emails for password resets and booking confirmations.

**GWT:**
- **Given** I have a `SendEmailAsync(to, subject, body)` method in my `IEmailService`
- **When** I call this method with valid parameters
- **Then** an email is successfully sent to the recipient's inbox

**Tech Hint:** Use SendGrid (free tier) or MailKit. Install the SendGrid NuGet package. Add your `SendGridApiKey` to `appsettings.json` (use UserSecrets, do not commit to GitHub). Create an `EmailService` class implementing `IEmailService` and inject it in `Program.cs`.

---

##### 6. Story: [M] Forgot Password Request
**As a** User (who forgot my password), **I want to** request a password reset link, **so that** I can regain access to my account.

**GWT:**
- **Given** I am on the "Forgot Password" page
- **When** I enter my registered email address
- **And** I click "Send Reset Link"
- **Then** the system generates a unique password reset token
- **And** the system sends an email (using the `IEmailService`) to my address containing a unique reset link
- **And** I see a message "If an account with this email exists, a reset link has been sent"

**Tech Hint:** Use `UserManager.FindByEmailAsync(email)` and `UserManager.GeneratePasswordResetTokenAsync(user)`. The link will be: `https://your-angular-app.com/reset-password?token=[token]&email=[email]` (URL-encoded).

---

##### 7. Story: [M] Reset Password (Using Link)
**As a** User (who received a reset email), **I want to** set a new password, **so that** I can log in.

**GWT:**
- **Given** I have clicked the reset link from my email and am on the "Reset Password" page
- **And** I can see the token and email in the URL
- **When** I enter a new, valid password
- **And** I confirm the new password
- **And** I click "Reset Password"
- **Then** my password is changed in the database
- **And** I am automatically logged in or redirected to the login page with a "Success" message

**Tech Hint:** Angular component reads token and email from URL query parameters. POST these (and new password) to `[HttpPost("reset-password")]` endpoint. Backend uses `UserManager.ResetPasswordAsync(user, token, newPassword)`.

---

##### 8. Story: [M] Update Password (Logged-In)
**As a** logged-in User, **I want to** update my password, **so that** I can keep my account secure.

**GWT:**
- **Given** I am logged in and on my "Account Settings" page
- **When** I enter my current password
- **And** I enter a new password (and confirm it)
- **And** I click "Change Password"
- **Then** the system validates my old password
- **And** my password is changed to the new one
- **And** I see a "Password updated successfully" message

**Tech Hint:** Protected endpoint `[Authorize]`. Get user via `UserManager.GetUserAsync(User)`. Use `UserManager.ChangePasswordAsync(user, oldPassword, newPassword)`.

---

### Sprint 1 (Day 3-4): Core Listing CRUD
**Goal:** Hosts can create/manage listings, and guests can see them.

#### User Stories

##### 1. Story: [M] Create Listing
**As a** Host, **I want to** create a new listing, **so that** I can rent my property.

**GWT:**
- **Given** I am a logged-in Host
- **When** I fill in the "Create Listing" form (title, description, price, city, country, max guests)
- **And** I click "Submit"
- **Then** a new Listing is created in the database, associated with my HostId

**Tech Hint:** Create a `ListingsController` with a `[HttpPost]` endpoint. Use `[Authorize]` to get `User.Identity.Name` (or ID) to set the `HostId`.

---

##### 2. Story: [M] Upload Listing Photos
**As a** Host, **I want to** upload multiple photos for my listing, **so that** guests can see the space.

**GWT:**
- **Given** I am on the "Edit Listing" page for my property
- **When** I select multiple image files
- **And** I click "Upload"
- **Then** the images are saved (e.g., to Cloudinary or Azure Blob)
- **And** new Photo records are created in the database linked to my ListingId

**Tech Hint:** Use `IFormFile` in your API endpoint. Use Cloudinary (`CloudinaryDotNet` NuGet package) to upload the file and get a URL. Save this URL in your `Photo` table.

---

##### 3. Story: [M] View All Listings (Homepage)
**As a** Guest, **I want to** view a homepage grid of all listings, **so that** I can browse properties.

**GWT:**
- **Given** I am on the homepage
- **When** the page loads
- **Then** I see a grid of all listings with their cover photo, title, price, and location

**Tech Hint:** Create a `[HttpGet("/api/listings")]` endpoint. Use EF Core: `_context.Listings.Include(l => l.Photos).ToListAsync()`. Select only the Photo where `IsCover == true`.

---

##### 4. Story: [M] Search by Location
**As a** Guest, **I want to** search for listings by city or country, **so that** I can find a place in a specific location.

**GWT:**
- **Given** I am on the homepage
- **When** I type "Alexandria" into the search bar
- **And** I click "Search"
- **Then** I only see listings where City == "Alexandria" or Country == "Alexandria"

**Tech Hint:** Add query parameters to `[HttpGet("/api/listings")]`: `public async Task<IActionResult> GetListings([FromQuery] string? location)`. Add `.Where(l => location == null || l.City.Contains(location) || l.Country.Contains(location))`.

---

##### 5. Story: [M] Update Listing
**As a** Host, **I want to** update my listing's details, **so that** I can keep information current.

**GWT:**
- **Given** I am a logged-in Host and on my listing's edit page
- **When** I change any field (title, price, description, etc.)
- **And** I click "Save Changes"
- **Then** the listing is updated in the database

**Tech Hint:** Create `[HttpPut("{id}")]` endpoint in `ListingsController`. Verify the logged-in user is the owner (`listing.HostId == userId`).

---

##### 6. Story: [M] Delete Listing
**As a** Host, **I want to** delete my listing, **so that** it no longer appears on the platform.

**GWT:**
- **Given** I am a logged-in Host viewing my listing
- **When** I click "Delete Listing"
- **And** I confirm the deletion
- **Then** the listing is removed from the database

**Tech Hint:** Create `[HttpDelete("{id}")]` endpoint in `ListingsController`. Verify the logged-in user is the owner before deleting.

---

### Sprint 2 (Day 5-6): Payment Integration (Must Have)
**Goal:** A guest can successfully book and pay for a listing.

#### User Stories

##### 1. Story: [M] Securely Pay for Booking
**As a** Guest, **I want to** securely pay for a booking, **so that** my reservation is confirmed.

**GWT:**
- **Given** I am on a listing's detail page
- **When** I select dates and guest count
- **And** I click "Reserve"
- **Then** I am shown a "Confirm and Pay" page
- **And** when I click "Pay", I am redirected to the Stripe Checkout page
- **And** after successful payment, I am redirected to a "Booking Confirmed" page
- **And** a new Booking record is created in the database

**Tech Hint:**
- **Backend:** Use `Stripe.net`. Create a `[HttpPost("create-checkout-session")]` endpoint with `SessionCreateOptions` (LineItems, SuccessUrl, CancelUrl). Return `Session.Id`.
- **Frontend:** Use `@stripe/stripe-js`. Call `stripe.redirectToCheckout({ sessionId: ... })`.
- **Webhook:** Create `[HttpPost("stripe-webhook")]` endpoint. Stripe calls this after payment succeeds. Create the Booking record here.

---

##### 2. Story: [M] View Single Listing Details
**As a** Guest, **I want to** view a single listing's details page, **so that** I can see all information before booking.

**GWT:**
- **Given** I am on the homepage
- **When** I click on a listing card
- **Then** I am taken to a detailed page showing all photos, description, amenities, location, and reviews

**Tech Hint:** Create `[HttpGet("{id}")]` endpoint in `ListingsController`. Use `.Include(l => l.Photos).Include(l => l.Reviews)`.

---

##### 3. Story: [M] Receive Booking Confirmation
**As a** Guest, **I want to** receive a confirmation after booking, **so that** I have a record of my reservation.

**GWT:**
- **Given** my payment was successful
- **When** the booking is created
- **Then** I receive an email with booking details (dates, listing, total price)

**Tech Hint:** In your Stripe webhook handler, after creating the Booking, call `IEmailService.SendEmailAsync()` with the booking confirmation details.

---

### Sprint 3 (Day 7-8): Real-Time Messaging (Must Have)
**Goal:** A guest and host can chat in real-time.

#### User Stories

##### 1. Story: [M] Contact Host from Listing
**As a** Guest, **I want to** contact a host from a listing page, **so that** I can ask questions before booking.

**GWT:**
- **Given** I am viewing a listing's detail page
- **When** I click "Contact Host"
- **Then** a new conversation is created (if one doesn't exist)
- **And** I am taken to the chat interface

**Tech Hint:** Create `ConversationsController` with `[HttpPost]` endpoint. Check if a conversation already exists for this Guest-Host-Listing combination. If not, create one.

---

##### 2. Story: [M] Send & Receive Messages in Real-Time
**As a** User, **I want to** send and receive messages in real-time, **so that** I can communicate efficiently.

**GWT:**
- **Given** I am in a chat window with another user
- **When** I type "Hello" and press "Send"
- **Then** my message instantly appears in my chat history
- **And** the other user (if online) instantly sees "Hello" appear in their chat

**Tech Hint:**
- **Backend:** Use `Microsoft.AspNetCore.SignalR`. Create `ChatHub.cs` inheriting from `Hub`. Implement `SendMessage(string user, string message, string conversationId)`. Use `Clients.Group(conversationId).SendAsync("ReceiveMessage", ...)`. Add users to groups: `Groups.AddToGroupAsync(Context.ConnectionId, conversationId)`.
- **Frontend:** Use `@microsoft/signalr`. Create `SignalRService`. Connect with `_hubConnection.start()`. Listen with `_hubConnection.on("ReceiveMessage", ...)`. Send with `_hubConnection.invoke("SendMessage", ...)`.

---

##### 3. Story: [M] View Past Conversation History
**As a** User, **I want to** see my past conversation history, **so that** I can review previous messages.

**GWT:**
- **Given** I am logged in
- **When** I navigate to "My Messages"
- **Then** I see a list of all my conversations
- **And** when I click on a conversation, I see all past messages

**Tech Hint:** Create `[HttpGet]` endpoint in `ConversationsController` to get user's conversations. Create `[HttpGet("{conversationId}/messages")]` to get all messages for a conversation with `.Include(c => c.Messages)`.

---

### Sprint 4 (Day 9-10): Advanced Search & Reviews (Should Have)
**Goal:** Implement advanced filtering and the review system.

#### User Stories

##### 1. Story: [S] Search by Available Dates
**As a** Guest, **I want to** search for listings by available dates, **so that** I only see properties I can actually book.

**GWT:**
- **Given** I am on the homepage
- **When** I select a startDate and endDate
- **And** I click "Search"
- **Then** the listing grid updates to show only listings that do not have any bookings that conflict with my selected dates

**Tech Hint:** Add date parameters to `GetListings`. Use LINQ:
```csharp
_context.Listings.Where(l => !l.Bookings.Any(b => 
    (startDate < b.EndDate && endDate > b.StartDate)))
```

---

##### 2. Story: [S] Filter by Number of Guests
**As a** Guest, **I want to** filter listings by number of guests, **so that** I only see properties that can accommodate my group.

**GWT:**
- **Given** I am on the homepage
- **When** I select "4 guests" from the filter
- **And** I click "Search"
- **Then** I only see listings where MaxGuests >= 4

**Tech Hint:** Add `[FromQuery] int? guests` parameter. Add `.Where(l => guests == null || l.MaxGuests >= guests)`.

---

##### 3. Story: [S] Leave a Review
**As a** Guest, **I want to** leave a rating and review for a completed stay, **so that** I can share my experience.

**GWT:**
- **Given** I am logged in and have a completed booking (EndDate < DateTime.Now)
- **When** I go to my "My Bookings" page
- **Then** I see a "Leave Review" button for that booking
- **And** when I submit the review, it is saved to the database

**Tech Hint:** Create `ReviewsController` with `[HttpPost]`. Take `ReviewDto` (Rating, Comment, BookingId). Verify GuestId matches booking and booking is in the past. Set `ListingId` and `GuestId` from the booking.

---

##### 4. Story: [S] View Listing Reviews
**As a** Guest, **I want to** see the average rating and all reviews on a listing, **so that** I can make an informed decision.

**GWT:**
- **Given** I am viewing a listing's detail page
- **When** the page loads
- **Then** I see the average star rating prominently displayed
- **And** I see all reviews with ratings, comments, and guest names

**Tech Hint:** In your `GetListingById` endpoint, include reviews: `.Include(l => l.Reviews).ThenInclude(r => r.Guest)`. Calculate average: `listing.Reviews.Average(r => r.Rating)`.

---

### Sprint 5 (Day 11-12): Profiles, Maps & Dashboards (Should Have)
**Goal:** Build user dashboards and map integration.

#### User Stories

##### 1. Story: [S] View Listings on Map
**As a** Guest, **I want to** see listings on an interactive map, **so that** I can understand their exact location.

**GWT:**
- **Given** I am on the homepage (or search results page)
- **When** the listings load
- **Then** I see a map with pins for each listing's location
- **And** when I click a pin, I see a small pop-up with the listing's info

**Tech Hint:**
- **Backend:** Add `Latitude` and `Longitude` properties to `Listing` model.
- **Frontend:** Install `leaflet` and `@asymmetrik/ngx-leaflet`. Create layers array: `[L.marker([listing.Latitude, listing.Longitude]).bindPopup(...)]`.

---

##### 2. Story: [S] Edit User Profile
**As a** User, **I want to** edit my profile (bio, profile picture), **so that** I can personalize my account.

**GWT:**
- **Given** I am logged in and on my profile page
- **When** I update my bio and upload a new profile picture
- **And** I click "Save"
- **Then** my profile is updated in the database

**Tech Hint:** Create `ProfileController` with `[HttpPut]` endpoint. Use `IFormFile` for image upload (Cloudinary). Update `ApplicationUser` with new `Bio` and `ProfilePictureUrl`.

---

##### 3. Story: [S] View My Bookings (Guest)
**As a** Guest, **I want to** view a "My Bookings" page, **so that** I can see all my past and upcoming trips.

**GWT:**
- **Given** I am logged in as a Guest
- **When** I navigate to "My Bookings"
- **Then** I see a list of all my bookings with dates, listing info, and status

**Tech Hint:** Create `[HttpGet("my-bookings")]` endpoint in `BookingsController` with `[Authorize]`. Filter by `GuestId` matching current user. Use `.Include(b => b.Listing).ThenInclude(l => l.Photos)`.

---

##### 4. Story: [S] View My Reservations (Host)
**As a** Host, **I want to** view a "My Reservations" dashboard, **so that** I can manage bookings for my properties.

**GWT:**
- **Given** I am logged in as a Host
- **When** I navigate to "My Reservations"
- **Then** I see all bookings for all my listings

**Tech Hint:** Create `[HttpGet("my-reservations")]` endpoint. Get all listings where `HostId == currentUserId`, then include their bookings: `.Include(l => l.Bookings).ThenInclude(b => b.Guest)`.

---

### Sprint 6 (Day 13-14): "Could Have" & Final Polish
**Goal:** Implement "wow" features and prepare for presentation.

#### User Stories

##### 1. Story: [C] AI Listing Description Generator
**As a** Host, **I want** AI to help me write my listing description, **so that** my listing looks professional and appealing.

**GWT:**
- **Given** I am on the "Create Listing" page
- **When** I enter keywords like "3 bedroom, nile view, alexandria"
- **And** I click "Generate"
- **Then** the main description text area is filled with an AI-generated paragraph

**Tech Hint:**
- **Backend:** Use `OpenAI-DotNet` library. Create `[HttpPost("generate-description")]` endpoint. Build prompt: `"Write a compelling Airbnb description for a property with these features: {keywords}"`. Call OpenAI API and return `response.Choices[0].Text`.

---

##### 2. Story: [C] Admin Dashboard
**As an** Admin, **I want** a dashboard to view all users, listings, and bookings, **so that** I can manage the platform.

**GWT:**
- **Given** I am logged in as an Admin
- **When** I navigate to the Admin Dashboard
- **Then** I see statistics and lists of all users, listings, and bookings
- **And** I can perform actions like deleting listings or banning users

**Tech Hint:** Create `AdminController` secured with `[Authorize(Roles = "Admin")]`. Requires adding Roles to ASP.NET Core Identity setup in `Program.cs`. Create endpoints for getting all entities.

---

##### 3. Story: [C] Save to Wishlist
**As a** Guest, **I want to** save listings to a "Wishlist," **so that** I can easily find properties I'm interested in.

**GWT:**
- **Given** I am viewing a listing
- **When** I click the heart icon
- **Then** the listing is added to my wishlist
- **And** when I visit "My Wishlist", I see all saved listings

**Tech Hint:** Create `WishlistController` with `[HttpPost("{listingId}")]` (to add) and `[HttpDelete("{listingId}")]` (to remove). Use the `UserWishlist` join table. Create `[HttpGet]` to retrieve user's wishlist.

---

##### 4. Story: [C] Real-Time Notifications
**As a** User, **I want to** receive a real-time notification for new messages or bookings, **so that** I stay informed.

**GWT:**
- **Given** I am logged in and on any page
- **When** I receive a new message or booking
- **Then** I see a notification pop-up instantly
- **And** the notification is saved in the database

**Tech Hint:** Extend `ChatHub` to send notifications via SignalR. Create `NotificationsController` to create notification records. Frontend listens to SignalR `"ReceiveNotification"` event and displays a toast/popup.

---

## 4. Sprint Summary

| Sprint | Days | Goal | Key Features |
|--------|------|------|--------------|
| Sprint 0 | 1-2 | Foundation | Registration, Login (Email & Google), Email Service, Password Reset |
| Sprint 1 | 3-4 | Listing CRUD | Create/Update/Delete Listings, Upload Photos, View Listings, Search by Location |
| Sprint 2 | 5-6 | Payment | Stripe Integration, Booking Creation, Payment Confirmation |
| Sprint 3 | 7-8 | Messaging | Real-Time Chat (SignalR), Conversation History |
| Sprint 4 | 9-10 | Search & Reviews | Date/Guest Filtering, Leave & View Reviews |
| Sprint 5 | 11-12 | Dashboards & Maps | My Bookings/Reservations, Profile Edit, Map Integration |
| Sprint 6 | 13-14 | Polish & Extras | AI Description, Admin Dashboard, Wishlists, Notifications |

---

## 5. Priority Legend

- **🅼 Must Have:** Core functionality required for the app to work.
- **🆂 Should Have:** Important features that add significant value.
- **🅲 Could Have:** Nice-to-have features that provide polish and "wow" factor.