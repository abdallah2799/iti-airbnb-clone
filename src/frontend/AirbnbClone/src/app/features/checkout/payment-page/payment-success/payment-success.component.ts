import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, CheckCircle, Loader2 } from 'lucide-angular';
import { BookingService } from '../../../../core/services/booking.service';
import { BookingStatus } from '../../../../core/models/booking.interface';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);

  isVerifying = signal<boolean>(true);
  verificationFailed = signal<boolean>(false);

  readonly icons = {
    CheckCircle,
    Loader2
  };

  ngOnInit(): void {
    // Get session_id from URL params (Stripe redirects with this)
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const pendingBookingId = sessionStorage.getItem('pendingBookingId');

    if (pendingBookingId) {
      // Verify the booking was actually confirmed
      this.verifyBookingStatus(Number(pendingBookingId));
    } else if (sessionId) {
      // Try to verify using session ID (fallback)
      this.isVerifying.set(true);
      // Give webhook some time to process (max 10 seconds)
      setTimeout(() => {
        this.isVerifying.set(false);
        // If still verifying after timeout, show warning
        sessionStorage.removeItem('pendingBookingId');
      }, 10000);
    } else {
      // No booking ID found, clear and show success anyway
      sessionStorage.removeItem('pendingBookingId');
      this.isVerifying.set(false);
    }
  }

  private verifyBookingStatus(bookingId: number): void {
    // Poll for booking confirmation (webhook might take a moment)
    const maxAttempts = 10;
    let attempts = 0;

    const checkBooking = () => {
      this.bookingService.getGuestBookings().subscribe({
        next: (bookings) => {
          const booking = bookings.find(b => b.id === bookingId);
          
          if (booking && booking.status === BookingStatus.Confirmed) {
            // Booking confirmed!
            this.isVerifying.set(false);
            sessionStorage.removeItem('pendingBookingId');
          } else if (attempts < maxAttempts) {
            // Try again in 1 second
            attempts++;
            setTimeout(checkBooking, 1000);
          } else {
            // Failed to confirm after max attempts
            this.isVerifying.set(false);
            this.verificationFailed.set(true);
            // Redirect to error page
            this.router.navigate(['/payment/error']);
          }
        },
        error: (err) => {
          console.error('Error verifying booking:', err);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkBooking, 1000);
          } else {
            this.isVerifying.set(false);
            this.verificationFailed.set(true);
            this.router.navigate(['/payment/error']);
          }
        }
      });
    };

    checkBooking();
  }
}
