import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.interface';
import { LucideAngularModule, Calendar, MapPin, Search } from 'lucide-angular';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './my-trips.component.html',
})
export class MyTripsComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookings = signal<Booking[]>([]);
  isLoading = signal<boolean>(true);

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
}
