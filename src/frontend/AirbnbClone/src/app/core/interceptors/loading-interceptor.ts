// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Removed ngx-spinner - loading states now handled at component level
  // This interceptor remains for future loading logic if needed
  
  return next(req).pipe(
    finalize(() => {
      // No global spinner
    })
  );
};