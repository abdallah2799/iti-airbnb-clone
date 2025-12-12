import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { BlankLayoutComponent } from './core/layouts/blank-layout/blank-layout.component';
import { HomeComponent } from './features/public/landing-page/home.component';
import { ForgotPasswordComponent } from './core/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './core/auth/change-password/change-password.component';
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/no-auth-guard';
import { hostGuard } from './core/guards/host.guard';
import { adminGuard } from './core/guards/admin.guard';
import { notAdminGuard } from './core/guards/not-admin.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';
import { guestViewGuard } from './core/guards/guest-view.guard';
import { hostViewGuard } from './core/guards/host-view.guard';
import { adminViewGuard } from './core/guards/admin-view.guard';
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
  {
    path: '',
    component: BlankLayoutComponent,
    canActivate: [notAdminGuard], // Prevent Admin from accessing client pages
    children: [
      { path: '', component: HomeComponent, title: 'Home Page', canActivate: [homeRedirectGuard] },
      { path: 'searchMap', component: SearchResultsComponent, canActivate: [guestViewGuard] },
      {
        path: 'rooms/:id',
        loadComponent: () =>
          import(
            './features/public/listing-details/listing-detail/listing-detail.component'
          ).then((m) => m.ListingDetailComponent),
        title: 'Listing Details',
        canActivate: [guestViewGuard]
      },

      // Host Routes (Nested & Guarded)
      {
        path: 'hosting',
        canActivate: [authGuard, hostGuard, hostViewGuard],
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
      { path: 'my-listings', component: MyListingsComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'my-listings/:id', component: ListingDetailsComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'my-listings/:id/edit', component: EditListingComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'reservations', component: HostReservationsComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'reservations/:id', component: ReservationDetailsComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'calendar', component: HostCalendarComponent, canActivate: [authGuard, hostGuard, hostViewGuard] },
      { path: 'host/reviews', loadComponent: () => import('./features/host/reviews/host-reviews.component').then(m => m.HostReviewsComponent), canActivate: [authGuard, hostGuard, hostViewGuard] },

      // Guest Routes
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [authGuard, guestViewGuard],
      },
      {
        path: 'trips',
        component: MyTripsComponent,
        canActivate: [authGuard, guestViewGuard],
        title: 'My Trips'
      },
      {
        path: 'wishlists',
        component: WishlistPageComponent,
        canActivate: [authGuard, guestViewGuard],
        title: 'Wishlists'
      },
      {
        path: 'search',
        loadComponent: () =>
          import(
            './features/public/search-results/search-results/search-results.component'
          ).then((m) => m.SearchResultsComponent),
        title: 'Search Results',
        canActivate: [guestViewGuard]
      },
      {
        path: 'trip-planner',
        loadComponent: () =>
          import(
            './features/public/trip-planner/trip-input.component'
          ).then((m) => m.TripInputComponent),
        title: 'Plan Your Trip',
        canActivate: [guestViewGuard]
      },
      {
        path: 'trip-result',
        loadComponent: () =>
          import(
            './features/public/trip-planner/trip-result.component'
          ).then((m) => m.TripResultComponent),
        title: 'Your Trip Itinerary',
        canActivate: [guestViewGuard]
      },

      // Checkout Routes
      {
        path: 'book/:id',
        component: CheckoutComponent,
        canActivate: [authGuard, guestViewGuard],
        title: 'Checkout'
      },
      {
        path: 'checkout/success',
        loadComponent: () =>
          import('./features/checkout/payment-page/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
        canActivate: [authGuard, guestViewGuard],
        title: 'Payment Success',
      },
      {
        path: 'payment/success',
        loadComponent: () =>
          import('./features/checkout/payment-page/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
        canActivate: [authGuard, guestViewGuard],
        title: 'Payment Success',
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./features/checkout/payment-page/payment.component').then((m) => m.PaymentComponent),
        canActivate: [authGuard, guestViewGuard],
        title: 'Payment',
      },

      {
        path: 'messages',
        loadComponent: () =>
          import('./features/guest/messages/messages/messages.component').then(
            (m) => m.MessagesComponent
          ),
        canActivate: [authGuard, guestViewGuard],
        title: 'Messages',
      },

      // --- Coming Soon Routes ---
      {
        path: 'experiences',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Experiences', message: 'Unique activities we can do together, led by a world of hosts.' },
        title: 'Experiences'
      },
      {
        path: 'services',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Services', message: 'Services to help you with your trip.' },
        title: 'Services'
      },
      {
        path: 'account-settings',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Account Settings', message: 'Manage your account details and preferences.' },
        title: 'Account Settings'
      },
      {
        path: 'languages',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Languages & Currency', message: 'Customize your language and currency preferences.' },
        title: 'Languages & Currency'
      },
      {
        path: 'help-center',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Help Center', message: 'Get help with your reservations, account, and more.' },
        title: 'Help Center'
      },
      {
        path: 'refer-host',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Refer a Host', message: 'Earn money when you refer a new host.' },
        title: 'Refer a Host'
      },
      {
        path: 'co-host',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Find a Co-Host', message: 'Get help hosting your place.' },
        title: 'Find a Co-Host'
      },
      {
        path: 'gift-cards',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Gift Cards', message: 'Give the gift of travel.' },
        title: 'Gift Cards'
      },
    ],
  },

  {
    path: '',
    component: AuthLayoutComponent,
    children: [
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
    ],
  },

  // Admin Routes (Lazy Loaded)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard, adminGuard, adminViewGuard]
  },

  // 404 Wildcard Route
  { path: '**', component: NotFoundComponent }
];
