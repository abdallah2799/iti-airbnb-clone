# Airbnb Clone API - Architectural Breakdown

## I. Observability & Logging
**Serilog Configuration:** Replaces the default logger. It is configured to write logs to three destinations: Console (immediate feedback), File (rolling daily logs), and MSSQL Server (structured queryable logs).

**Request Logging:** The `app.UseSerilogRequestLogging` middleware is added early to capture timing, status codes, and user details for every incoming HTTP request.

## II. Data & Identity Layer
**Database Connection:** Connects to SQL Server using Entity Framework Core (`AddDbContext`).

**Identity Management:** Configures ASP.NET Core Identity for user/role management with strict password policies (8 chars, uppercase, lowercase, digits).

**Dependency Injection:** Registers the Unit of Work pattern and individual Repositories (Data Access Layer) as Scoped services.

## III. Business Logic & Utilities
**Domain Services:** Registers all business logic services (Auth, Listing, Booking, Payment, etc.) as Scoped to ensure fresh instances per request.

**AutoMapper:** Registers mapping profiles to transform complex Database Entities into clean DTOs for the frontend.

**External Integrations:** Configures Stripe for payments and Cloudinary for image storage.

## IV. Authentication & Security
**JWT Authentication:** Sets up "Bearer" token validation. It includes specific logic to read tokens from the Query String for SignalR connections (since WebSockets cannot easily use headers).

**Google OAuth:** Conditionally configures "Login with Google" if the API keys are present in settings.

**CORS Policy:** Opens a specific gate (AllowAngularApp) to allow your Angular frontend (localhost:4200) to communicate with the backend, while blocking others.

## V. Real-Time Communication
**SignalR:** Services added to support real-time chat (`AddSignalR`) and the endpoint route mapped to `/hubs/chat`.

## VI. Documentation (Dev Experience)
**OpenAPI/Scalar:** Generates API documentation. You are using Scalar UI (a modern alternative to Swagger UI) to visualize endpoints, but it is restricted to run only in the Development environment.

## VII. The Middleware Pipeline (Execution Order)
The exact path a request takes through the application:

1. **Serilog Request Logger:** Starts the timer and logging context.
2. **Swagger/Scalar:** Returns documentation UI (Development only).
3. **HTTPS Redirection:** Forces insecure HTTP requests to HTTPS.
4. **CORS:** Checks if the request origin (Angular) is allowed.
5. **Authentication:** Validates the JWT token ("Who are you?").
6. **Authorization:** Checks user roles/permissions ("Can you do this?").
7. **Controllers/Hubs:** Finally executes code (`MapControllers`, `MapHub`).
