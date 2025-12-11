import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const notAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole('SuperAdmin')) {
        // SuperAdmins are jailed to the admin dashboard
        return router.createUrlTree(['/admin/dashboard']);
    }

    return true;
};
