import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect guest-only routes
 * If user is in host view mode, redirect to /reservations
 * If user is in guest view mode, allow access
 */
export const guestViewGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is in hosting view mode
  const isHostingView = authService.isHostingViewValue;
  const isAuthenticated = authService.isAuthenticated();
  const isHost = authService.hasRole('Host');

  // If user is in hosting view mode and is actually a host, redirect to host dashboard
  if (isHostingView && isAuthenticated && isHost) {
    return router.createUrlTree(['/reservations']);
  }

  // Otherwise, allow access to guest routes
  return true;
};
