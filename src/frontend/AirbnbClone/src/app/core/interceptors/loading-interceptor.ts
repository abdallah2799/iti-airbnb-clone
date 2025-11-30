// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(NgxSpinnerService);
  let displaySpinner = true;

  // 1. Check for Skip Header
  if (req.headers.has('X-Skip-Loader')) {
    displaySpinner = false;
    req = req.clone({ headers: req.headers.delete('X-Skip-Loader') });
  }

  // 2. Check for "Silent" Endpoints (Chat, Search, Notifications)
  if (req.url.toLowerCase().includes('/chat') ||
    req.url.toLowerCase().includes('/messages') ||
    req.url.toLowerCase().includes('/conversations') ||
    req.url.toLowerCase().includes('/unread-count') ||
    req.url.toLowerCase().includes('/search') ||
    req.url.toLowerCase().includes('/notifications')) {
    displaySpinner = false;
  }

  if (displaySpinner) {
    spinner.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (displaySpinner) {
        spinner.hide();
      }
    })
  );
};