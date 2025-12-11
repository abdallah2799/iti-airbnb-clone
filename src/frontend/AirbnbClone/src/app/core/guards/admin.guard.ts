import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastr = inject(ToastrService);

    // Check if user has either Admin OR SuperAdmin role
    if (authService.hasRole('SuperAdmin') || authService.hasRole('Admin')) {
        return true;
    }

    toastr.error('You do not have permission to access the admin area.', 'Access Denied');

    // Redirect logic
    if (authService.isAuthenticated()) {
        return router.createUrlTree(['/']);
    }

    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
