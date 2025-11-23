// header.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const headerInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const authToken = localStorage.getItem('auth_token');

  let headersConfig: any = {
    Accept: 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  };

  // If it IS FormData, we leave Content-Type empty so the browser adds the correct boundary.
  if (!(req.body instanceof FormData)) {
    headersConfig['Content-Type'] = 'application/json';
  }

  const authReq = req.clone({
    setHeaders: headersConfig,
  });

  return next(authReq);
};
