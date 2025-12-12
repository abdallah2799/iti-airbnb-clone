import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard for admin routes to ensure clean admin-only environment
 * Clears any guest/host view mode and ensures admin access only
 */
export const adminViewGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.hasRole('Admin') || authService.hasRole('SuperAdmin');

  // If not authenticated or not admin, redirect to home
  if (!isAuthenticated || !isAdmin) {
    return router.createUrlTree(['/']);
  }

  // Clear any guest/host view mode for admin
  // Admins should not have view mode set
  authService.setHostingView(false);
  localStorage.removeItem('view_mode');

  // Allow access to admin routes
  return true;
};
