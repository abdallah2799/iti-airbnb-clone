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

export const routes: Routes = [
  {
    path: '',
    component: BlankLayoutComponent,
    // canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent, title: 'Home Page' },
      { path: 'become-a-host', component: ListingIntroComponent },
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
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./core/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Register Page',
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
