import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostService } from '../../services/host.service';
import {
  ListingDetailsDto,
  ListingStatus,
  BookingStatus,
  ListingBookingDto,
} from '../../models/listing-details.model';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import { ListingCreationService } from '../../services/listing-creation.service';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
  isToday,
} from 'date-fns';

@Component({
  selector: 'app-host-calendar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './host-calendar.component.html',
})
export class HostCalendarComponent implements OnInit {
  private hostService = inject(HostService);

  currentDate = signal<Date>(new Date());
  reservations = signal<ListingBookingDto[]>([]);
  isLoading = signal<boolean>(true);

  readonly icons = { ChevronLeft, ChevronRight };
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate the grid of days for the current view
  calendarDays = computed(() => {
    const curr = this.currentDate();
    const monthStart = startOfMonth(curr);
    const monthEnd = endOfMonth(curr);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((date) => {
      // Find a reservation that covers this day
      const booking = this.reservations().find(
        (r) =>
          r.status === BookingStatus.Confirmed &&
          isWithinInterval(date, {
            start: parseISO(r.startDate),
            end: parseISO(r.endDate),
          })
      );

      return {
        date,
        dayNumber: format(date, 'd'),
        isCurrentMonth: isSameMonth(date, monthStart),
        isToday: isToday(date),
        booking: booking,
        // Helpers for styling the bar
        isStartOfBooking: booking ? isSameDay(date, parseISO(booking.startDate)) : false,
        isEndOfBooking: booking ? isSameDay(date, parseISO(booking.endDate)) : false,
        // Simulate price (In real app, fetch from Listing availability)
        price: 59,
      };
    });
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
      error: (err) => console.error(err),
    });
  }

  nextMonth() {
    this.currentDate.update((d) => addMonths(d, 1));
  }

  prevMonth() {
    this.currentDate.update((d) => subMonths(d, 1));
  }

  goToToday() {
    this.currentDate.set(new Date());
  }
}
