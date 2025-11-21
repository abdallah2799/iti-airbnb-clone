import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HostService } from '../../services/host.service';
import { ToastrService } from 'ngx-toastr';
import {
  LucideAngularModule,
  ChevronLeft,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Check,
  X,
} from 'lucide-angular';
import { BookingStatus } from '../../models/listing-details.model';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './reservation-details.component.html',
})
export class ReservationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private hostService = inject(HostService);
  private toastr = inject(ToastrService);

  booking = signal<any>(null); // We'll use the DTO from the backend
  isLoading = signal<boolean>(true);
  isProcessing = signal<boolean>(false);

  BookingStatus = BookingStatus;
  readonly icons = { ChevronLeft, Calendar, User, CreditCard, MapPin, Check, X };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadBooking(id);
  }

  loadBooking(id: number) {
    this.hostService.getBookingById(id).subscribe({
      next: (data) => {
        this.booking.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastr.error('Could not load reservation');
        this.location.back();
      },
    });
  }

  goBack() {
    this.location.back();
  }

  approve() {
    this.isProcessing.set(true);
    this.hostService.approveBooking(this.booking().id).subscribe({
      next: () => {
        this.toastr.success('Reservation Confirmed!');
        this.loadBooking(this.booking().id); // Refresh data
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastr.error(err.error || 'Failed to approve');
        this.isProcessing.set(false);
      },
    });
  }

  reject() {
    this.isProcessing.set(true);
    this.hostService.rejectBooking(this.booking().id).subscribe({
      next: () => {
        this.toastr.success('Reservation Declined');
        this.loadBooking(this.booking().id); // Refresh data
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.toastr.error('Failed to reject');
        this.isProcessing.set(false);
      },
    });
  }
}
