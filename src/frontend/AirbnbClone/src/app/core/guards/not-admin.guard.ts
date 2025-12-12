import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const notAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();

    // Block access if user has SuperAdmin or Admin role
    if (user && user.role) {
        const roles = Array.isArray(user.role) ? user.role : [user.role];

        if (roles.includes('SuperAdmin') || roles.includes('Admin')) {
            // Redirect admin users to admin dashboard
            router.navigate(['/admin']);
            return false;
        }
    }

    // Allow access for non-admin users
    return true;
};
