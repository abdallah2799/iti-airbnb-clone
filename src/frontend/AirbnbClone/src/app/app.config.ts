import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router'; // <--- Imported withInMemoryScrolling

import { routes } from './app.routes';
import { LucideAngularModule, Home, Lightbulb, Bell, Globe, Menu, Search, Hammer } from 'lucide-angular';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { headerInterceptor } from './core/interceptors/header-interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Updated Router Configuration with Scroll Restoration
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // Scrolls to top on navigation
        anchorScrolling: 'enabled'        // Allows scrolling to anchors (e.g. #reviews)
      })
    ),

    importProvidersFrom(
      LucideAngularModule.pick({ Home, Lightbulb, Bell, Globe, Menu, Search, Hammer })
    ),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, headerInterceptor, authInterceptor])),
    provideAnimations(), // Required for Toastr
    provideToastr(),
    provideMarkdown()
  ]
};