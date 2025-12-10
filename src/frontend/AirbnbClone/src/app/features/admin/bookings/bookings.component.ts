import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBookingDto, BookingStatus } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Booking Management</h2>
      </div>

      <!-- Bookings Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Info</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let booking of bookings">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ booking.listingTitle }}</div>
                      <div class="text-xs text-gray-500">ID: {{ booking.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ booking.guestFullName }}</div>
                  <div class="text-sm text-gray-500">{{ booking.guestEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ booking.startDate | date:'shortDate' }} - {{ booking.endDate | date:'shortDate' }}</div>
                  <div class="text-xs text-gray-400">{{ booking.guests }} guests</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ booking.totalPrice | currency }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    [ngModel]="booking.status"
                    (ngModelChange)="updateStatus(booking, $event)"
                    class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
                    [ngClass]="{
                      'bg-green-50 text-green-800': booking.status === BookingStatus.Confirmed,
                      'bg-yellow-50 text-yellow-800': booking.status === BookingStatus.Pending,
                      'bg-red-50 text-red-800': booking.status === BookingStatus.Cancelled
                    }">
                    <option [value]="BookingStatus.Pending">Pending</option>
                    <option [value]="BookingStatus.Confirmed">Confirmed</option>
                    <option [value]="BookingStatus.Cancelled">Cancelled</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="viewBooking(booking)" class="text-blue-600 hover:text-blue-900 mr-4" title="View Details">
                    <span class="material-icons text-base">visibility</span>
                  </button>
                  <button (click)="deleteBooking(booking)" class="text-red-600 hover:text-red-900" title="Delete">
                    <span class="material-icons text-base">delete</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="bookings.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6" *ngIf="totalCount > 0">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (page - 1) * pageSize + 1 }}</span> to <span class="font-medium">{{ Math.min(page * pageSize, totalCount) }}</span> of <span class="font-medium">{{ totalCount }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="onPageChange(page - 1)" [disabled]="page === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Previous</span>
                  <span class="material-icons text-sm">chevron_left</span>
                </button>
                <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {{ page }} of {{ totalPages }}
                </span>
                <button (click)="onPageChange(page + 1)" [disabled]="page === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Next</span>
                  <span class="material-icons text-sm">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Detail Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="'Booking #' + selectedBooking?.id" (closeEvent)="closeModal()">
        <div *ngIf="selectedBooking" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold text-gray-700">Booking Details</h4>
                    <p class="text-sm text-gray-600"><span class="font-medium">Dates:</span> {{ selectedBooking.startDate | date:'mediumDate' }} - {{ selectedBooking.endDate | date:'mediumDate' }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Guests:</span> {{ selectedBooking.guests }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Total Price:</span> {{ selectedBooking.totalPrice | currency }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Status:</span> {{ selectedBooking.status === BookingStatus.Confirmed ? 'Confirmed' : (selectedBooking.status === BookingStatus.Pending ? 'Pending' : 'Cancelled') }}</p>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-700">Listing</h4>
                    <p class="text-sm text-gray-600"><span class="font-medium">Title:</span> {{ selectedBooking.listingTitle }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Host:</span> {{ selectedBooking.hostFullName }} ({{ selectedBooking.hostEmail }})</p>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-700">Guest Info</h4>
                <p class="text-sm text-gray-600"><span class="font-medium">Name:</span> {{ selectedBooking.guestFullName }}</p>
                <p class="text-sm text-gray-600"><span class="font-medium">Email:</span> {{ selectedBooking.guestEmail }}</p>
            </div>
        </div>
        
        <div footer class="flex justify-end space-x-3 w-full">
            <!-- Add any specific actions here if needed, e.g. Refund -->
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class BookingsComponent implements OnInit {
  bookings: AdminBookingDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  BookingStatus = BookingStatus;
  Math = Math;

  // Modal State
  isModalOpen = false;
  selectedBooking: AdminBookingDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.adminService.getBookings(this.page, this.pageSize).subscribe({
      next: (result) => {
        this.bookings = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
      },
      error: (err) => {
        this.toastr.error('Failed to load bookings', 'Error');
        console.error(err);
      }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadBookings();
    }
  }

  updateStatus(booking: AdminBookingDto, newStatus: any): void {
    const statusValue = Number(newStatus);

    this.adminService.updateBookingStatus(booking.id, statusValue).subscribe({
      next: () => {
        this.toastr.success('Booking status updated', 'Success');
        booking.status = statusValue;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to update status', 'Error');
        this.loadBookings();
      }
    });
  }

  deleteBooking(booking: AdminBookingDto): void {
    if (confirm(`Are you sure you want to delete booking #${booking.id}? This cannot be undone.`)) {
      this.adminService.deleteBooking(booking.id).subscribe({
        next: () => {
          this.toastr.success('Booking deleted successfully', 'Success');
          this.loadBookings();
        },
        error: (err) => {
          this.toastr.error(err.message || 'Failed to delete booking', 'Error');
        }
      });
    }
  }

  viewBooking(booking: AdminBookingDto): void {
    this.selectedBooking = booking;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedBooking = null;
  }
}
