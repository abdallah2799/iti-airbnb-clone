import { 
  HttpErrorResponse, 
  HttpEvent, 
  HttpHandlerFn, 
  HttpInterceptorFn, 
  HttpRequest 
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Global state variables
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  // 1. Helper: Add the Token to the Header (Explicitly typed)
  const addTokenHeader = (request: HttpRequest<any>, token: string | null): HttpRequest<any> => {
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  };

  // 2. Add the CURRENT access token
  let authReq = addTokenHeader(req, authService.getToken());

  // 3. Handle the Request
  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        
        // If logout is in progress or no tokens exist, don't try to refresh token
        if (authService.isLoggingOutNow() || (!authService.getToken() && !authService.getRefreshToken())) {
          return throwError(() => error);
        }
        
        // Stop infinite loops on refresh endpoint
        if (req.url.includes('refresh-token')) {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
        }

        // Handle 401
        return handle401Error(authReq, next, authService, router, toastr);
      }
      
      return throwError(() => error);
    })
  );
};

// 4. The Logic (Explicitly typed return)
function handle401Error(
  req: HttpRequest<any>, 
  next: HttpHandlerFn, 
  authService: AuthService, 
  router: Router, 
  toastr: ToastrService
): Observable<HttpEvent<any>> {
  
  // Helper inside to keep types consistent
  const addTokenHeader = (request: HttpRequest<any>, token: string | null): HttpRequest<any> => {
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  };

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokenResponse: any) => {
        isRefreshing = false;
        
        const newToken = tokenResponse.token;
        refreshTokenSubject.next(newToken);
        
        // Return the retry request
        return next(addTokenHeader(req, newToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        
        // Don't show error or redirect if logout is already in progress
        if (!authService.isLoggingOutNow()) {
          authService.logout();
          router.navigate(['/login']);
          toastr.error('Your session has expired. Please log in again.', 'Session Expired');
        }
        
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenHeader(req, token));
      })
    );
  }
}