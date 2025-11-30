import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const hostGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.hasRole('Host')) {
        return true;
    }

    // Redirect to home if not a host
    router.navigate(['/']);
    return false;
};
