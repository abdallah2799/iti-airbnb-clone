import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBookingDto, BookingStatus } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LucideAngularModule, Search, Calendar, User, DollarSign, CheckCircle, XCircle, Clock, Eye, Trash2, Filter, ArrowUp, ArrowDown, ChevronRight, ChevronLeft } from 'lucide-angular';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, ModalComponent, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-800">Booking Management</h2>
        
        <div class="flex items-center gap-4 w-full sm:w-auto">
            <!-- Status Filter -->
            <select [(ngModel)]="selectedStatusFilter" (change)="onStatusFilterChange()" 
                class="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="">All Statuses</option>
                <option [value]="BookingStatus.Pending">Pending</option>
                <option [value]="BookingStatus.Confirmed">Confirmed</option>
                <option [value]="BookingStatus.Cancelled">Cancelled</option>
            </select>

            <!-- Search Bar -->
            <div class="relative w-full sm:w-64">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <lucide-icon [img]="icons.Search" class="w-4 h-4 text-gray-400"></lucide-icon>
                </div>
                <input 
                    type="text" 
                    [(ngModel)]="searchTerm" 
                    (ngModelChange)="onSearch($event)"
                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                    placeholder="Search bookings..."
                >
            </div>
        </div>
      </div>

      <!-- Bookings Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" (click)="onSort('title')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Booking Info
                        <lucide-icon *ngIf="sortBy === 'title'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" (click)="onSort('guest')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Guest
                         <lucide-icon *ngIf="sortBy === 'guest'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                <th scope="col" (click)="onSort('dates')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Dates
                         <lucide-icon *ngIf="sortBy === 'dates'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" (click)="onSort('totalPrice')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Total
                         <lucide-icon *ngIf="sortBy === 'totalPrice'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" (click)="onSort('status')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Status
                         <lucide-icon *ngIf="sortBy === 'status'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let booking of bookings">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{{ booking.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ booking.guestFullName }}</div>
                  <div class="text-sm text-gray-500">{{ booking.guestEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ booking.listingTitle }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ booking.startDate | date:'shortDate' }} -</div>
                  <div>{{ booking.endDate | date:'shortDate' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  \${{ booking.totalPrice }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-green-100 text-green-800': booking.status === BookingStatus.Confirmed,
                      'bg-yellow-100 text-yellow-800': booking.status === BookingStatus.Pending,
                      'bg-red-100 text-red-800': booking.status === BookingStatus.Cancelled
                    }">
                    {{ BookingStatus[booking.status] }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <!-- Details Button -->
                  <button (click)="viewBooking(booking)" class="text-blue-600 hover:text-blue-900 mr-3 p-1 hover:bg-blue-50 rounded" title="View Details">
                    <lucide-icon [img]="icons.Eye" class="w-5 h-5"></lucide-icon>
                  </button>
                  
                  <!-- Cancel Button (only if Pending) - Soft Cancel -->
                  <button *ngIf="booking.status === BookingStatus.Pending" 
                          (click)="cancelBooking(booking)" 
                          class="text-orange-600 hover:text-orange-900 mr-3 p-1 hover:bg-orange-50 rounded" 
                          title="Cancel Booking (Change Status)">
                    <lucide-icon [img]="icons.XCircle" class="w-5 h-5"></lucide-icon>
                  </button>
                  
                  <!-- Delete Button (always) - Hard Delete -->
                  <button (click)="deleteBooking(booking)" 
                          class="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" 
                          title="Delete Booking Permanently">
                    <lucide-icon [img]="icons.Trash2" class="w-5 h-5"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="bookings.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                     <div class="flex flex-col items-center justify-center">
                        <lucide-icon [img]="icons.Search" class="w-12 h-12 text-gray-300 mb-2"></lucide-icon>
                        <p class="text-lg font-medium">No bookings found</p>
                    </div>
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
                  <lucide-icon [img]="icons.ChevronLeft" class="w-4 h-4"></lucide-icon>
                </button>
                <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {{ page }} of {{ totalPages }}
                </span>
                <button (click)="onPageChange(page + 1)" [disabled]="page === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Next</span>
                  <lucide-icon [img]="icons.ChevronRight" class="w-4 h-4"></lucide-icon>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

       <!-- Booking Detail Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="'Booking #' + selectedBooking?.id" (closeEvent)="closeModal()">
        <div *ngIf="selectedBooking" class="space-y-4">
             <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                   <p class="text-sm text-gray-500">Status</p>
                   <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1"
                    [ngClass]="{
                      'bg-green-100 text-green-800': selectedBooking.status === BookingStatus.Confirmed,
                      'bg-yellow-100 text-yellow-800': selectedBooking.status === BookingStatus.Pending,
                      'bg-red-100 text-red-800': selectedBooking.status === BookingStatus.Cancelled
                    }">
                    {{ BookingStatus[selectedBooking.status] }}
                  </span>
                </div>
                 <div>
                   <p class="text-sm text-gray-500">Total Price</p>
                   <p class="text-lg font-bold text-gray-900">\${{ selectedBooking.totalPrice }}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div class="bg-white border rounded-lg p-4">
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2 mb-2">Guest Info</h4>
                     <div class="space-y-1">
                        <p class="text-sm text-gray-600"><span class="font-medium">Name:</span> {{ selectedBooking.guestFullName }}</p>
                        <p class="text-sm text-gray-600"><span class="font-medium">Email:</span> {{ selectedBooking.guestEmail }}</p>
                    </div>
                </div>
                 <div class="bg-white border rounded-lg p-4">
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2 mb-2">Listing Info</h4>
                     <div class="space-y-1">
                        <p class="text-sm text-gray-600"><span class="font-medium">Title:</span> {{ selectedBooking.listingTitle }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
                 <h4 class="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <lucide-icon [img]="icons.Calendar" class="w-4 h-4"></lucide-icon> Dates
                 </h4>
                 <div class="flex items-center gap-4 text-sm text-gray-600">
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Check-In</p>
                        <p class="font-medium">{{ selectedBooking.startDate | date:'mediumDate' }}</p>
                    </div>
                    <lucide-icon [img]="icons.ChevronRight" class="w-4 h-4 text-gray-400"></lucide-icon>
                     <div>
                        <p class="text-xs text-gray-500 uppercase">Check-Out</p>
                        <p class="font-medium">{{ selectedBooking.endDate | date:'mediumDate' }}</p>
                    </div>
                 </div>
            </div>
        </div>
        
         <div footer class="flex justify-end space-x-3 w-full border-t pt-4 mt-4">
                <button (click)="closeModal()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                    Close
                </button>
                 <button *ngIf="selectedBooking?.status !== BookingStatus.Cancelled" (click)="cancelBooking(selectedBooking!); closeModal()" class="inline-flex items-center gap-2 justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm">
                    <lucide-icon [img]="icons.XCircle" class="w-4 h-4"></lucide-icon> Cancel Booking
                </button>
            </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookings: AdminBookingDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  Math = Math;
  BookingStatus = BookingStatus;

  readonly icons = { Search, Eye, XCircle, Trash2, ChevronLeft, ChevronRight, Calendar, ArrowUp, ArrowDown };

  searchTerm = '';
  selectedStatusFilter: string = '';

  // Sorting State
  sortBy = 'dates'; // Default sort
  isDescending = true;

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;

  // Modal State
  isModalOpen = false;
  selectedBooking: AdminBookingDto | null = null;

  // Deletion State
  isDeleting = false;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private confirmationDialog: ConfirmationDialogService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.page = 1;
      this.loadBookings();
    });
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadBookings();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.isDescending = !this.isDescending;
    } else {
      this.sortBy = column;
      this.isDescending = true;
    }
    this.loadBookings();
  }

  loadBookings(): void {
    this.adminService.getBookings(this.page, this.pageSize, this.selectedStatusFilter || undefined, this.searchTerm, this.sortBy, this.isDescending).subscribe({
      next: (result) => {
        this.bookings = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.cdr.detectChanges();
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

  cancelBooking(booking: AdminBookingDto): void {
    if (this.isDeleting) return; // Prevent duplicate clicks

    this.confirmationDialog.confirm({
      title: 'Cancel Booking?',
      message: `Cancel booking #${booking.id}? This will change the status to Cancelled.`,
      confirmText: 'Yes, cancel it',
      confirmColor: 'warning',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.isDeleting = true;
        this.adminService.updateBookingStatus(booking.id, BookingStatus.Cancelled).subscribe({
          next: () => {
            this.isDeleting = false;
            this.toastr.success('Booking cancelled successfully', 'Success');
            this.loadBookings();
          },
          error: (err) => {
            this.isDeleting = false;
            this.toastr.error('Failed to cancel booking', 'Error');
          }
        });
      }
    });
  }

  deleteBooking(booking: AdminBookingDto): void {
    if (this.isDeleting) return; // Prevent duplicate clicks

    this.confirmationDialog.confirm({
      title: 'Delete Booking?',
      message: `Are you sure you want to permanently delete booking #${booking.id}? This action cannot be undone.`,
      confirmText: 'Yes, delete it!',
      confirmColor: 'danger',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.isDeleting = true;
        this.adminService.deleteBooking(booking.id).subscribe({
          next: () => {
            this.isDeleting = false;
            this.toastr.success('Booking deleted successfully', 'Success');
            this.loadBookings();
          },
          error: (err) => {
            this.isDeleting = false;
            this.toastr.error(err.message || 'Failed to delete booking', 'Error');
          }
        });
      }
    });
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
