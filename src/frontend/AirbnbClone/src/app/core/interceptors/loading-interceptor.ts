// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const ngxSpinnerService = inject(NgxSpinnerService);

  // URLs that should NOT show the global loading spinner
  const skipLoadingUrls = [
    '/conversations',        // All conversation endpoints
    '/messages',             // Message endpoints
    '/unread-count',         // Unread count polling
    'hubs/chat',            // SignalR hub
    '/api/conversations',   // Full API path (if using full URL)
  ];

  // Check if the current request URL should skip loading spinner
  const shouldSkipLoading = skipLoadingUrls.some(skipUrl => 
    req.url.includes(skipUrl)
  );

  // Only show spinner if URL is not in skip list
  if (!shouldSkipLoading) {
    ngxSpinnerService.show();
  }

  return next(req).pipe(
    finalize(() => {
      // Only hide spinner if we showed it
      if (!shouldSkipLoading) {
        ngxSpinnerService.hide();
      }
    })
  );
};