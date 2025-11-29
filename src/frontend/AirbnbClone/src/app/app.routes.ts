import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { BlankLayoutComponent } from './core/layouts/blank-layout/blank-layout.component';
import { HomeComponent } from './features/home/home.component';
import { ForgotPasswordComponent } from './core/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './core/auth/change-password/change-password.component';
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/no-auth-guard';
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
import { MyListingsComponent } from './features/host/pages/my-listings/my-listings.component';
import { ListingDetailsComponent } from './features/host/pages/listing-details/listing-details.component';
import { EditListingComponent } from './features/host/pages/edit-listing/edit-listing.component';
import { ReservationDetailsComponent } from './features/host/pages/reservation-details/reservation-details.component';
import { HostReservationsComponent } from './features/host/pages/host-reservations/host-reservations.component';
import { HostCalendarComponent } from './features/host/pages/host-calendar/host-calendar.component';
import { AmenitiesComponent } from './features/host/steps/amenities/amenities.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { SearchPageComponent } from './features/search-page/search-page.component';

export const routes: Routes = [
  {
    path: '',
    component: BlankLayoutComponent,
    children: [
      { path: '', component: HomeComponent, title: 'Home Page' },
      { path: 'searchMap', component: SearchPageComponent },
      {
        path: 'listings/:id',
        loadComponent: () =>
          import(
            './features/listings/pages/listing-detail/listing-detail/listing-detail.component'
          ).then((m) => m.ListingDetailComponent),
        title: 'Listing Details',
      },
      { path: 'hosting', component: ListingIntroComponent },
      { path: 'hosting/structure', component: StructureComponent },
      { path: 'hosting/privacy-type', component: PrivacyTypeComponent },
      { path: 'hosting/floor-plan', component: FloorPlanComponent },
      { path: 'hosting/amenities', component: AmenitiesComponent },
      { path: 'hosting/location', component: LocationComponent },
      { path: 'hosting/price', component: PriceComponent },
      { path: 'hosting/instant-book', component: InstantBookComponent },
      { path: 'hosting/title', component: TitleComponent },
      { path: 'hosting/description', component: DescriptionComponent },
      { path: 'hosting/publish', component: PublishComponent },
      { path: 'hosting/photos', component: PhotosComponent },

      { path: 'my-listings', component: MyListingsComponent },
      { path: 'my-listings/:id', component: ListingDetailsComponent },
      { path: 'my-listings/:id/edit', component: EditListingComponent },

      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [authGuard], // Add your auth guard
      },
      {
        path: 'search',
        loadComponent: () =>
          import(
            './features/listings/pages/search-results/search-results/search-results.component'
          ).then((m) => m.SearchResultsComponent),
        title: 'Search Results',
      },

      // --- Start of Merged Changes ---
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/messaging/messages/messages.component').then(
            (m) => m.MessagesComponent
          ),
        canActivate: [authGuard],
        title: 'Messages',
      },
      {
        path: 'reservations/:id',
        component: ReservationDetailsComponent,
        canActivate: [authGuard],
      },
      {
        path: 'reservations',
        component: HostReservationsComponent,
        canActivate: [authGuard],
      },
      { path: 'calendar', component: HostCalendarComponent, canActivate: [authGuard] },
      // --- End of Merged Changes ---

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
        path: 'trips',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Trips', message: 'No trips booked... yet!' },
        title: 'Trips'
      },
      {
        path: 'wishlists',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        data: { title: 'Wishlists', message: 'Save your favorite places for later.' },
        title: 'Wishlists'
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
];
