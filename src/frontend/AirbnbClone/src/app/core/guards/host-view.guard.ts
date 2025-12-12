import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect host-only routes
 * If user is in guest view mode, redirect to home page
 * If user is in host view mode, allow access
 * Also checks if user is authenticated and has Host role
 */
export const hostViewGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isHostingView = authService.isHostingViewValue;
  const isAuthenticated = authService.isAuthenticated();
  const isHost = authService.hasRole('Host');

  // If user is not authenticated or not a host, redirect to home
  if (!isAuthenticated || !isHost) {
    return router.createUrlTree(['/']);
  }

  // If user is authenticated and is a host but in guest view mode, redirect to home
  if (!isHostingView) {
    return router.createUrlTree(['/']);
  }

  // Allow access to host routes
  return true;
};
