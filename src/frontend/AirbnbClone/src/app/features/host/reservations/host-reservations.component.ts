import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HostService } from 'src/app/features/host/services/host.service';
import { ListingBookingDto, BookingStatus } from 'src/app/features/host/models/listing-details.model';
import { LucideAngularModule, Search, Filter, Menu } from 'lucide-angular';
@Component({
  selector: 'app-host-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './host-reservations.component.html',
})
export class HostReservationsComponent implements OnInit {
  private hostService = inject(HostService);

  reservations = signal<ListingBookingDto[]>([]);
  isLoading = signal<boolean>(true);

  // Matches the screenshot pills
  activeTab = signal<'today' | 'upcoming'>('today');

  BookingStatus = BookingStatus;

  // Computed: Filter logic for the "Today" vs "Upcoming" view
  filteredReservations = computed(() => {
    const all = this.reservations();
    const tab = this.activeTab();
    const now = new Date();

    if (tab === 'today') {
      // "Today" usually shows guests currently checking in/out or staying today
      return all.filter((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        return start <= now && end >= now && r.status === BookingStatus.Confirmed;
      });
    } else {
      // "Upcoming" shows future confirmed bookings
      return all
        .filter(
          (r) =>
            new Date(r.startDate) > now &&
            (r.status === BookingStatus.Confirmed || r.status === BookingStatus.Pending)
        )
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
  });

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.hostService.getHostReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: 'today' | 'upcoming') {
    this.activeTab.set(tab);
  }
}
