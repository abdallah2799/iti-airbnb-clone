// error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
        }
        else if (error.error.propertyName) {
          errorMessage = `Validation error: ${error.error.propertyName}`;
        }
        else if (Array.isArray(error.error)) {
          errorMessage = error.error.join(', ');
        }
        else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        else if (error.error.title || error.error.detail) {
          errorMessage = error.error.title || error.error.detail || errorMessage;
        }
      }

      switch (error.status) {
        case 400:
          toastr.error(errorMessage, 'Bad Request');
          break;
        case 401:
          toastr.error('Please log in again', 'Unauthorized');
          break;
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

      return throwError(() => error);
    })
  );
};