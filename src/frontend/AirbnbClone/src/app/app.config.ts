import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { LucideAngularModule, Home, Lightbulb, Bell, Globe, Menu, Search, Hammer } from 'lucide-angular';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { provideToastr } from 'ngx-toastr';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { headerInterceptor } from './core/interceptors/header-interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({ Home, Lightbulb, Bell, Globe, Menu, Search, Hammer })
    ),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor, errorInterceptor, headerInterceptor, authInterceptor])),
    importProvidersFrom(NgxSpinnerModule),
    provideAnimations(), // Required for both Toastr and some spinners
    provideToastr()
  ]
};
