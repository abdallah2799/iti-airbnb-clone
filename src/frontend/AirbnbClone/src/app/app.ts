import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { SearchBarComponent } from "./shared/components/search-bar/search-bar.component";
import { LoginModalComponent } from "./core/auth/login-modal/login-modal.component";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';
import { PaymentService } from './core/services/payment.service';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, LoginModalComponent, FooterComponent, ChatWidgetComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
  // Using default change detection for consistency
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-project');
  private router = inject(Router);
  private paymentService = inject(PaymentService);

  showNavbar = signal(true);
  showFooter = signal(true);
  showChatbot = true;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.url);
      this.checkPendingBooking(event.url);
    });
  }

  ngOnInit(): void {
    initFlowbite();
  }

  private checkRoute(url: string) {
    // Hide navbar/footer on hosting flow pages (except dashboard) AND admin pages
    const isHostingFlow = url.includes('/hosting/') && url !== '/hosting';
    const isAdminPage = url.includes('/admin');

    this.showNavbar.set(!isHostingFlow && !isAdminPage);
    this.showFooter.set(!isHostingFlow && !isAdminPage);
    this.showChatbot = !isAdminPage; // Hide Chatbot on Admin pages
  }

  private checkPendingBooking(url: string) {
    // Don't cancel if we're on the payment page or success page
    if (url.includes('/payment')) {
      return;
    }

    // Check for abandoned pending bookings
    const pendingBookingId = sessionStorage.getItem('pendingBookingId');
    if (pendingBookingId) {
      this.paymentService.cancelPendingBooking(Number(pendingBookingId)).subscribe({
        next: () => {
          console.log('Deleted abandoned pending booking:', pendingBookingId);
          sessionStorage.removeItem('pendingBookingId');
        },
        error: (err) => {
          console.error('Failed to delete pending booking:', err);
          sessionStorage.removeItem('pendingBookingId');
        }
      });
    }
  }
}
