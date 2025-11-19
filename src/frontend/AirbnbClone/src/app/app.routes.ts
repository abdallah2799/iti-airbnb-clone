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

export const routes: Routes = [
  {
    path: '',
    component: BlankLayoutComponent,
    // canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent, title: 'Home Page' },
      { path: 'become-a-host', component: ListingIntroComponent },
      { path: 'become-a-host/structure', component: StructureComponent },
      { path: 'become-a-host/privacy-type', component: PrivacyTypeComponent },
      { path: 'become-a-host/floor-plan', component: FloorPlanComponent },
      { path: 'become-a-host/location', component: LocationComponent },
      { path: 'become-a-host/price', component: PriceComponent },
      { path: 'become-a-host/instant-book', component: InstantBookComponent },
      { path: 'become-a-host/title', component: TitleComponent },
      { path: 'become-a-host/description', component: DescriptionComponent },
      { path: 'become-a-host/publish', component: PublishComponent },
      { path: 'become-a-host/photos', component: PhotosComponent },
      { path: 'my-listings', component: MyListingsComponent },
      { path: 'my-listings/:id', component: ListingDetailsComponent },
      { path: 'my-listings/:id/edit', component: EditListingComponent },
    ],
        {path: '', component: HomeComponent, title: 'Home Page'}
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login',  loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent), title: 'Login Page' },
      { path: 'register', loadComponent: () => import('./core/auth/register/register.component').then(m => m.RegisterComponent), title: 'Register Page' },
      { path: 'forgot-password',  loadComponent: () => import('./core/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'ForgotPassword Page' },
      { path: 'auth/reset-password', component: ResetPasswordComponent, title: 'ResetPassword Page' },
      { path: 'change-password',loadComponent: () => import('./core/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent), canActivate: [authGuard], title: 'ChangePassword Page' },
    ],
  },
  
];
