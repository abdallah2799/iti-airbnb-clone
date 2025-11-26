// error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error) => {
      // ... (Your existing message extraction logic is great, keep it!) ...
      let errorMessage = 'An unexpected error occurred';
      if (error.error?.message) errorMessage = error.error.message;
      // ... etc ...

      // --- THE CHANGE IS HERE ---
      // We skip 401 here because the AuthInterceptor handles the refresh logic.
      // If the refresh FAILS, the AuthInterceptor will redirect to login.
      
      if (error.status !== 401) { 
          switch (error.status) {
            case 400:
              toastr.error(errorMessage, 'Bad Request');
              break;
            // case 401:  <-- DELETED! Don't show toast here.
            //   toastr.error('Please log in again', 'Unauthorized');
            //   break;
            case 403:
              toastr.error('You do not have permission', 'Forbidden');
              break;
            case 404:
              toastr.error('Resource not found', 'Not Found');
              break;
            case 409:
              toastr.error(errorMessage, 'Conflict');
              break;
            case 500:
              toastr.error('Server error, please try again later', 'Server Error');
              break;
            default:
              toastr.error(errorMessage, 'Error');
          }
      }

      return throwError(() => error);
    })
  );
};