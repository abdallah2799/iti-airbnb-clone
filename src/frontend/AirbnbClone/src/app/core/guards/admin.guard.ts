import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole('SuperAdmin')) {
        return true;
    }

    // Redirect to home if not authorized
    return router.createUrlTree(['/']);
};
