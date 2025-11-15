# 🏠 ITI Airbnb Clone

A full-stack property rental platform inspired by Airbnb, built as a graduation project for ITI Full Stack .NET program.

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?logo=angular)](https://angular.io/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-CC2927?logo=microsoft-sql-server)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Timeline](#development-timeline)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The ITI Airbnb Clone is a comprehensive web application that enables property owners (Hosts) to list their properties and guests to search, book, and review accommodations. The platform includes real-time messaging, secure payment processing, advanced search capabilities, and an intuitive user experience.

**Key Objectives:**
- Demonstrate full-stack development skills with .NET and Angular
- Implement modern software architecture patterns (Clean Architecture, Repository Pattern)
- Integrate third-party services (Stripe, SendGrid, Cloudinary)
- Build real-time features using SignalR
- Follow agile development methodology with 14-day sprint plan

## ✨ Features

### 🔐 Authentication & Authorization
- Email/Password registration and login
- Google OAuth 2.0 integration
- JWT-based authentication
- Password reset via email
- Secure session management

### 🏘️ Property Listings
- Create, read, update, delete listings
- Upload multiple photos (up to 10 per listing)
- Categorize by property type (Apartment, House, Villa, Cabin, Room)
- Rich property details (bedrooms, bathrooms, max guests, amenities)
- Host profile integration

### 🔍 Search & Discovery
- Search by location (city/country)
- Filter by available dates
- Filter by number of guests
- Interactive map view with property pins
- Advanced filtering options

### 💳 Booking & Payment
- Secure payment processing via Stripe Checkout
- Date availability validation
- Booking confirmation emails
- Guest booking history
- Host reservations dashboard

### 💬 Real-Time Messaging
- Live chat between guests and hosts (SignalR)
- Conversation history
- Message read status
- Instant notifications

### ⭐ Reviews & Ratings
- Leave reviews for completed stays
- 5-star rating system
- Average rating display
- Review verification (only guests who booked can review)

### 👤 User Profiles
- Customizable bio and profile picture
- User dashboard
- Booking/reservation management
- Profile visibility

### 📱 Additional Features
- Wishlist (save favorite listings)
- Real-time notifications
- Admin dashboard (manage users, listings, bookings)
- AI-powered listing description generator (OpenAI integration)
- Responsive design (mobile, tablet, desktop)

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 17+
- **Language:** TypeScript 5.0+
- **UI Components:** Angular Material / Custom CSS
- **State Management:** RxJS
- **Real-Time:** @microsoft/signalr
- **Maps:** Leaflet with ngx-leaflet
- **HTTP Client:** Angular HttpClient
- **Build Tool:** Angular CLI

### Backend
- **Framework:** ASP.NET Core 9.0
- **Language:** C# 12
- **Architecture:** Clean Architecture with CQRS (optional)
- **ORM:** Entity Framework Core 9.0
- **Authentication:** ASP.NET Core Identity + JWT
- **Real-Time:** SignalR
- **API Documentation:** Swagger/OpenAPI
- **Validation:** FluentValidation

### Database
- **RDBMS:** SQL Server 2019+
- **Migrations:** EF Core Migrations

### Third-Party Services
- **Payment Processing:** Stripe
- **Email Delivery:** SendGrid / MailKit
- **Image Hosting:** Cloudinary / Azure Blob Storage
- **OAuth Provider:** Google OAuth 2.0
- **AI Integration:** OpenAI API (optional)

### DevOps & Tools
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions / Azure Pipelines
- **Hosting:** Azure App Service / AWS
- **Containerization:** Docker (optional)
- **Monitoring:** Application Insights (optional)

## 🏗️ Architecture

The project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── backend/
│   └── AirbnbClone/
│       ├── Api/                 # Presentation Layer (Controllers, Middleware)
│       ├── Application/         # Application Layer (Use Cases, DTOs, Interfaces)
│       ├── Core/                # Domain Layer (Entities, Enums, Domain Logic)
│       └── Infrastructure/      # Infrastructure Layer (EF Core, External Services)
│
└── frontend/
    └── AirbnbClone/
        └── src/
            └── app/
                ├── core/        # Core services, guards, interceptors
                ├── features/    # Feature modules (auth, listing, booking, etc.)
                └── shared/      # Shared components, models, services
```

### Key Patterns
- **Repository Pattern:** Data access abstraction
- **Dependency Injection:** Loose coupling and testability
- **DTO Pattern:** Data transfer between layers
- **CQRS (Optional):** Separate read and write operations
- **Unit of Work:** Transaction management

## 🚀 Getting Started

### Prerequisites

- [.NET 9.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) and npm
- [SQL Server 2019+](https://www.microsoft.com/sql-server) (or SQL Server Express)
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdallah2799/iti-airbnb-clone.git
   cd iti-airbnb-clone
   ```

2. **Backend Setup**
   ```bash
   cd src/backend/AirbnbClone
   
   # Restore NuGet packages
   dotnet restore
   
   # Update appsettings.json with your configuration
   # - Database connection string
   # - JWT secret key
   # - Stripe API keys
   # - SendGrid API key
   # - Cloudinary credentials
   # - Google OAuth credentials
   
   # Apply database migrations
   dotnet ef database update --project Infrastructure --startup-project Api
   
   # Run the API
   cd Api
   dotnet run
   ```
   
   The API will be available at `https://localhost:5001`

3. **Frontend Setup**
   ```bash
   cd src/frontend/AirbnbClone
   
   # Install dependencies
   npm install
   
   # Update environment files (src/environments/)
   # - API base URL
   # - Stripe publishable key
   # - Google OAuth client ID
   
   # Run the development server
   ng serve
   ```
   
   The application will be available at `http://localhost:4200`

### Configuration

#### Backend Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AirbnbClone;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-min-32-characters",
    "Issuer": "AirbnbCloneAPI",
    "Audience": "AirbnbCloneClient",
    "ExpirationMinutes": 1440
  },
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_..."
  },
  "SendGrid": {
    "ApiKey": "SG...",
    "FromEmail": "noreply@airbnbclone.com",
    "FromName": "Airbnb Clone"
  },
  "Cloudinary": {
    "CloudName": "your-cloud-name",
    "ApiKey": "your-api-key",
    "ApiSecret": "your-api-secret"
  },
  "Google": {
    "ClientId": "your-google-client-id.apps.googleusercontent.com",
    "ClientSecret": "your-google-client-secret"
  }
}
```

#### Frontend Configuration (src/environments/environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api',
  stripePublishableKey: 'pk_test_...',
  googleClientId: 'your-google-client-id.apps.googleusercontent.com'
};
```

### Database Setup

The database schema will be automatically created when you run migrations. The schema includes:

- **ApplicationUser** - User accounts (ASP.NET Identity)
- **Listing** - Property listings
- **Photo** - Listing images
- **Booking** - Reservations
- **Review** - Ratings and reviews
- **Conversation** - Chat sessions
- **Message** - Chat messages
- **UserWishlist** - Saved listings
- **Notification** - User notifications

See [database_schema.md](docs/database_schema.md) for detailed schema documentation.

## 📁 Project Structure

```
iti-airbnb-clone/
├── docs/
│   ├── backlog.md              # Agile project plan & user stories
│   ├── database_schema.md      # Database design & relationships
│   └── srs.md                  # Software Requirements Specification
│
├── src/
│   ├── backend/
│   │   └── AirbnbClone/
│   │       ├── AirbnbClone.sln
│   │       ├── Api/
│   │       │   ├── Controllers/
│   │       │   ├── Middleware/
│   │       │   ├── Program.cs
│   │       │   └── appsettings.json
│   │       ├── Application/
│   │       │   ├── DTOs/
│   │       │   ├── Interfaces/
│   │       │   └── Services/
│   │       ├── Core/
│   │       │   ├── Entities/
│   │       │   └── Enums/
│   │       └── Infrastructure/
│   │           ├── Data/
│   │           ├── Repositories/
│   │           └── Services/
│   │
│   └── frontend/
│       └── AirbnbClone/
│           ├── angular.json
│           ├── package.json
│           └── src/
│               ├── app/
│               │   ├── core/
│               │   ├── features/
│               │   │   ├── auth/
│               │   │   ├── listing/
│               │   │   ├── booking/
│               │   │   ├── review/
│               │   │   └── user/
│               │   └── shared/
│               ├── assets/
│               └── environments/
│
└── README.md
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

**Swagger UI:** `https://localhost:5001/swagger`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/{id}` - Get listing details
- `POST /api/listings` - Create listing (Host only)
- `PUT /api/listings/{id}` - Update listing (Host only)
- `DELETE /api/listings/{id}` - Delete listing (Host only)
- `POST /api/listings/{id}/photos` - Upload photos

#### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `POST /api/payments/create-checkout-session` - Create Stripe session
- `POST /api/payments/webhook` - Stripe webhook

#### Messaging
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/{id}/messages` - Get messages
- **SignalR Hub:** `/chatHub` - Real-time messaging

#### Reviews
- `GET /api/reviews?listingId={id}` - Get listing reviews
- `POST /api/reviews` - Create review

#### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

## 📅 Development Timeline

The project follows a **14-day sprint-based agile approach**:

| Sprint | Days | Focus Area | Key Deliverables |
|--------|------|------------|------------------|
| **Sprint 0** | 1-2 | Foundation | Auth system, Database setup, Email service |
| **Sprint 1** | 3-4 | Listings | CRUD operations, Photo upload, Search |
| **Sprint 2** | 5-6 | Payments | Stripe integration, Booking creation |
| **Sprint 3** | 7-8 | Messaging | Real-time chat, Conversation history |
| **Sprint 4** | 9-10 | Search & Reviews | Advanced filters, Rating system |
| **Sprint 5** | 11-12 | Dashboards | User profiles, Booking/Reservation views, Maps |
| **Sprint 6** | 13-14 | Polish | AI features, Admin panel, Notifications |

See [backlog.md](docs/backlog.md) for detailed user stories and acceptance criteria.

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[backlog.md](docs/backlog.md)** - Agile project plan with 14-day sprint breakdown and detailed user stories
- **[database_schema.md](docs/database_schema.md)** - Complete database schema with table descriptions and relationships
- **[srs.md](docs/srs.md)** - Software Requirements Specification with functional and non-functional requirements

## 🧪 Testing

### Backend Testing
```bash
cd src/backend/AirbnbClone
dotnet test
```

### Frontend Testing
```bash
cd src/frontend/AirbnbClone
npm test
```

### End-to-End Testing
```bash
cd src/frontend/AirbnbClone
npm run e2e
```

## 🚢 Deployment

### Backend Deployment (Azure)
```bash
# Publish the application
dotnet publish -c Release

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --resource-group airbnb-clone-rg \
  --name airbnb-clone-api \
  --src publish.zip
```

### Frontend Deployment (Azure Static Web Apps)
```bash
# Build for production
ng build --configuration production

# Deploy to Azure
az staticwebapp deploy \
  --name airbnb-clone-frontend \
  --resource-group airbnb-clone-rg \
  --app-location dist/airbnb-clone
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- **Backend:** Follow Microsoft C# coding conventions
- **Frontend:** Follow Angular style guide
- Write meaningful commit messages
- Add unit tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**ITI Full Stack .NET - Graduation Project**

- Project Type: Educational/Portfolio Project
- Institution: Information Technology Institute (ITI)
- Program: Full Stack .NET Development
- Year: 2025

## 🙏 Acknowledgments

- Inspired by [Airbnb](https://www.airbnb.com/)
- Built with guidance from ITI instructors
- Thanks to the open-source community for excellent tools and libraries

## 📧 Contact

For questions or feedback, please contact:
- GitHub: [@abdallah2799](https://github.com/abdallah2799)
- Repository: [iti-airbnb-clone](https://github.com/abdallah2799/iti-airbnb-clone)

---

**Made with ❤️ by ITI Full Stack .NET Students**