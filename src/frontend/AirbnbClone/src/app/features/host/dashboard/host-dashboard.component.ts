import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HostService } from '../services/host.service';
import { AuthService } from '../../../core/services/auth.service';
import { ListingDetailsDto, ListingBookingDto, BookingStatus } from '../models/listing-details.model';
import { LucideAngularModule, Plus, Calendar, Home, MessageSquare, Star, DollarSign } from 'lucide-angular';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './host-dashboard.component.html',
})
export class HostDashboardComponent implements OnInit {
  private hostService = inject(HostService);
  private authService = inject(AuthService);

  // State Signals
  listings = signal<ListingDetailsDto[]>([]);
  reservations = signal<ListingBookingDto[]>([]);
  isLoading = signal<boolean>(true);
  userName = signal<string>('Host');

  // Stats
  activeListingsCount = signal<number>(0);
  upcomingReservationsCount = signal<number>(0);
  totalRevenue = signal<number>(0); // Mock for now

  readonly icons = {
    Plus, Calendar, Home, MessageSquare, Star, DollarSign
  };

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.fullName);
    }

    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    // ForkJoin would be better, but doing sequential for simplicity and error handling
    this.hostService.getMyListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.activeListingsCount.set(data.length);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading listings:', err);
        this.checkLoadingComplete();
      }
    });

    this.hostService.getHostReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        // Filter for upcoming reservations (status 'Confirmed' or 'Pending' and future date)
        const upcoming = data.filter(r =>
          (r.status === BookingStatus.Confirmed || r.status === BookingStatus.Pending) &&
          new Date(r.startDate) >= new Date()
        );
        this.upcomingReservationsCount.set(upcoming.length);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.checkLoadingComplete();
      }
    });
  }

  private loadingCount = 0;
  private checkLoadingComplete() {
    this.loadingCount++;
    if (this.loadingCount >= 2) {
      this.isLoading.set(false);
    }
  }

  getRecentReservations() {
    return this.reservations()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }
}
