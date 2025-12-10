import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { HomeComponent } from './features/public/landing-page/home.component';
import { ForgotPasswordComponent } from './core/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './core/auth/change-password/change-password.component';
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/no-auth-guard';
import { hostGuard } from './core/guards/host.guard';
import { adminGuard } from './core/guards/admin.guard';
import { notAdminGuard } from './core/guards/not-admin.guard';
import { ListingIntroComponent } from './features/host/listing-intro/listing-intro.component';
import { StructureComponent } from './features/host/steps/structure/structure.component';
import { PrivacyTypeComponent } from './features/host/steps/privacy-type/privacy-type.component';
import { FloorPlanComponent } from './features/host/steps/floor-plan/floor-plan.component';
import { LocationComponent } from './features/host/steps/location/location.component';
import { PriceComponent } from './features/host/steps/price/price.component';
import { InstantBookComponent } from './features/host/steps/instant-book/instant-book.component';
import { TitleComponent } from './features/host/steps/title/title.component';
import { PublishComponent } from './features/host/steps/publish/publish.component';
import { DescriptionComponent } from './features/host/steps/description/description.component';
import { PhotosComponent } from './features/host/steps/photos/photos.component';
import { MyListingsComponent } from './features/host/manage-listings/my-listings.component';
import { ListingDetailsComponent } from './features/host/pages/listing-details/listing-details.component';
import { EditListingComponent } from './features/host/pages/edit-listing/edit-listing.component';
import { ReservationDetailsComponent } from './features/host/pages/reservation-details/reservation-details.component';
import { HostReservationsComponent } from './features/host/reservations/host-reservations.component';
import { HostCalendarComponent } from './features/host/pages/host-calendar/host-calendar.component';
import { AmenitiesComponent } from './features/host/steps/amenities/amenities.component';
import { UserProfileComponent } from './features/guest/profile/user-profile.component';
import { SearchPageComponent } from './features/search-page/search-page.component';
import { MyTripsComponent } from './features/guest/trips/my-trips.component';
import { WishlistComponent } from './features/guest/wishlists/wishlist.component';
import { WishlistPageComponent } from './pages/wishlist/wishlist-page.component';
import { HostDashboardComponent } from './features/host/dashboard/host-dashboard.component';
import { CheckoutComponent } from './features/checkout/checkout/checkout.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { SearchResultsComponent } from './features/public/search-results/search-results/search-results.component';

export const routes: Routes = [
  // 1. ADMIN ROUTES (Lazy Loaded & Guarded)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [adminGuard]
  },

  // 2. PUBLIC & GUEST ROUTES
  { path: '', component: HomeComponent, title: 'Home Page', canActivate: [notAdminGuard] },
  { path: 'searchMap', component: SearchResultsComponent, canActivate: [notAdminGuard] },
  {
    path: 'rooms/:id',
    loadComponent: () =>
      import(
        './features/public/listing-details/listing-detail/listing-detail.component'
      ).then((m) => m.ListingDetailComponent),
    title: 'Listing Details',
    canActivate: [notAdminGuard]
  },

  // Host Routes (Nested & Guarded)
  {
    path: 'hosting',
    canActivate: [authGuard, hostGuard, notAdminGuard],
    children: [
      { path: '', component: HostDashboardComponent },
      { path: 'intro', component: ListingIntroComponent },
      { path: 'structure', component: StructureComponent },
      { path: 'privacy-type', component: PrivacyTypeComponent },
      { path: 'floor-plan', component: FloorPlanComponent },
      { path: 'amenities', component: AmenitiesComponent },
      { path: 'location', component: LocationComponent },
      { path: 'price', component: PriceComponent },
      { path: 'instant-book', component: InstantBookComponent },
      { path: 'title', component: TitleComponent },
      { path: 'description', component: DescriptionComponent },
      { path: 'publish', component: PublishComponent },
      { path: 'photos', component: PhotosComponent },
    ]
  },

  // Host Management Routes
  { path: 'my-listings', component: MyListingsComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'my-listings/:id', component: ListingDetailsComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'my-listings/:id/edit', component: EditListingComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'reservations', component: HostReservationsComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'reservations/:id', component: ReservationDetailsComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'calendar', component: HostCalendarComponent, canActivate: [authGuard, hostGuard, notAdminGuard] },
  { path: 'host/reviews', loadComponent: () => import('./features/host/reviews/host-reviews.component').then(m => m.HostReviewsComponent), canActivate: [authGuard, hostGuard, notAdminGuard] },

  // Guest Routes
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard, notAdminGuard],
  },
  {
    path: 'trips',
    component: MyTripsComponent,
    canActivate: [authGuard, notAdminGuard],
    title: 'My Trips'
  },
  {
    path: 'wishlists',
    component: WishlistPageComponent,
    canActivate: [authGuard, notAdminGuard],
    title: 'Wishlists'
  },
  {
    path: 'search',
    loadComponent: () =>
      import(
        './features/public/search-results/search-results/search-results.component'
      ).then((m) => m.SearchResultsComponent),
    title: 'Search Results',
    canActivate: [notAdminGuard]
  },
  {
    path: 'trip-planner',
    loadComponent: () =>
      import(
        './features/public/trip-planner/trip-input.component'
      ).then((m) => m.TripInputComponent),
    title: 'Plan Your Trip',
    canActivate: [notAdminGuard]
  },
  {
    path: 'trip-result',
    loadComponent: () =>
      import(
        './features/public/trip-planner/trip-result.component'
      ).then((m) => m.TripResultComponent),
    title: 'Your Trip Itinerary',
    canActivate: [notAdminGuard]
  },

  // Checkout Routes
  {
    path: 'book/:id',
    component: CheckoutComponent,
    canActivate: [authGuard, notAdminGuard],
    title: 'Checkout'
  },
  {
    path: 'checkout/success',
    loadComponent: () =>
      import('./features/checkout/payment-page/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
    canActivate: [authGuard, notAdminGuard],
    title: 'Payment Success',
  },
  {
    path: 'payment/success',
    loadComponent: () =>
      import('./features/checkout/payment-page/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
    canActivate: [authGuard, notAdminGuard],
    title: 'Payment Success',
  },
  {
    path: 'payment',
    loadComponent: () =>
      import('./features/checkout/payment-page/payment.component').then((m) => m.PaymentComponent),
    canActivate: [authGuard, notAdminGuard],
    title: 'Payment',
  },

  {
    path: 'messages',
    loadComponent: () =>
      import('./features/guest/messages/messages/messages.component').then(
        (m) => m.MessagesComponent
      ),
    canActivate: [authGuard, notAdminGuard],
    title: 'Messages',
  },

  // --- Coming Soon Routes ---
  {
    path: 'experiences',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Experiences', message: 'Unique activities we can do together, led by a world of hosts.' },
    title: 'Experiences',
    canActivate: [notAdminGuard]
  },
  {
    path: 'services',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Services', message: 'Services to help you with your trip.' },
    title: 'Services',
    canActivate: [notAdminGuard]
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Account Settings', message: 'Manage your account details and preferences.' },
    title: 'Account Settings',
    canActivate: [authGuard, notAdminGuard]
  },
  {
    path: 'languages',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Languages & Currency', message: 'Customize your language and currency preferences.' },
    title: 'Languages & Currency',
    canActivate: [notAdminGuard]
  },
  {
    path: 'help-center',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Help Center', message: 'Get help with your reservations, account, and more.' },
    title: 'Help Center',
    canActivate: [notAdminGuard]
  },
  {
    path: 'refer-host',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Refer a Host', message: 'Earn money when you refer a new host.' },
    title: 'Refer a Host',
    canActivate: [notAdminGuard]
  },
  {
    path: 'co-host',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Find a Co-Host', message: 'Get help hosting your place.' },
    title: 'Find a Co-Host',
    canActivate: [notAdminGuard]
  },
  {
    path: 'gift-cards',
    loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
    data: { title: 'Gift Cards', message: 'Give the gift of travel.' },
    title: 'Gift Cards',
    canActivate: [notAdminGuard]
  },

  // 3. AUTH ROUTES (Login/Register)
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Login Page',
    canActivate: [noAuthGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./core/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Register Page',
    canActivate: [noAuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./core/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    title: 'ForgotPassword Page',
  },
  {
    path: 'auth/reset-password',
    component: ResetPasswordComponent,
    title: 'ResetPassword Page',
  },
  {
    path: 'auth/confirm-email',
    loadComponent: () =>
      import('./core/auth/confirm-email/confirm-email.component').then(
        (m) => m.ConfirmEmailComponent
      ),
    title: 'Confirm Email',
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./core/auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
    canActivate: [authGuard],
    title: 'ChangePassword Page',
  },

  // 404 Wildcard Route
  { path: '**', component: NotFoundComponent }
];
