import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { ReviewService } from '../../../core/services/review.service';
import { Booking, BookingStatus } from '../../../core/models/booking.interface';
import { LucideAngularModule, Calendar, MapPin, Search } from 'lucide-angular';
import { ReviewFormComponent } from '../../../shared/components/review-form/review-form.component';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReviewFormComponent],
  templateUrl: './my-trips.component.html',
})
export class MyTripsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private reviewService = inject(ReviewService);

  bookings = signal<Booking[]>([]);
  isLoading = signal<boolean>(true);

  // Review Modal State
  isReviewModalOpen = signal<boolean>(false);
  selectedBookingId = signal<number | null>(null);
  selectedListingId = signal<number | null>(null);

  readonly BookingStatus = BookingStatus;
  readonly icons = {
    Calendar, MapPin, Search
  };

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.isLoading.set(true);
    this.bookingService.getGuestBookings().subscribe({
      next: (data) => {
        // Sort by start date, most recent first
        const sorted = data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        this.bookings.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.isLoading.set(false);
      }
    });
  }

  get upcomingTrips() {
    const now = new Date();
    return this.bookings().filter(b => new Date(b.endDate) >= now);
  }

  get pastTrips() {
    const now = new Date();
    return this.bookings().filter(b => new Date(b.endDate) < now);
  }

  openReviewModal(event: Event, booking: Booking) {
    event.preventDefault();
    event.stopPropagation();

    // Check if already reviewed (could be optimized by fetching this info with bookings)
    this.reviewService.canReview(booking.id).subscribe(canReview => {
      if (canReview) {
        this.selectedBookingId.set(booking.id);
        this.selectedListingId.set(booking.listingId);
        this.isReviewModalOpen.set(true);
      } else {
        // Optional: Show toast that review is not possible (already reviewed or too old)
        console.log('Cannot review this booking');
      }
    });
  }

  closeReviewModal() {
    this.isReviewModalOpen.set(false);
    this.selectedBookingId.set(null);
    this.selectedListingId.set(null);
  }

  onReviewSubmitted() {
    // Refresh bookings or update status if needed
    this.loadBookings();
  }

  cancelBooking(event: Event, bookingId: number) {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings();
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          alert('Failed to cancel booking. Please try again.');
        }
      });
    }
  }
}
