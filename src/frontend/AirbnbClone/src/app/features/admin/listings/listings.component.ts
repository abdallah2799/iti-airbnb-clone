import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminListingDto, ListingStatus } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LucideAngularModule, Eye, Trash2, CheckCircle, XCircle, Search, ArrowUp, ArrowDown } from 'lucide-angular';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, skip } from 'rxjs/operators';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-800">
          {{ currentStatusFilter === 'UnderReview' ? 'Unverified Listings' : 'Listing Management' }}
        </h2>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <!-- Status Filter - Completely removed when viewing unverified listings -->
             <div *ngIf="currentStatusFilter !== 'UnderReview'" class="relative">
                <select 
                    [(ngModel)]="selectedStatusFilter"
                    (change)="onStatusFilterChange()"
                    class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option [ngValue]="null">All Statuses</option>
                  <option [value]="ListingStatus.Draft">Draft</option>
                  <option [value]="ListingStatus.Published">Published</option>
                  <option [value]="ListingStatus.Unlisted">Unlisted</option>
                  <option [value]="ListingStatus.Suspended">Suspended</option>
                  <option [value]="ListingStatus.UnderReview">Under Review</option>
                </select>
             </div>

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
                placeholder="Search listings..."
              >
            </div>
        </div>
      </div>

      <!-- Listings Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" (click)="onSort('title')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Listing
                        <lucide-icon *ngIf="sortBy === 'title'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                <th scope="col" (click)="onSort('price')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Price
                        <lucide-icon *ngIf="sortBy === 'price'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <!-- Status Column - Hide when viewing unverified listings -->
                <th *ngIf="currentStatusFilter !== 'UnderReview'" scope="col" (click)="onSort('status')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Status
                        <lucide-icon *ngIf="sortBy === 'status'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" (click)="onSort('date')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    <div class="flex items-center gap-1">
                        Created
                        <lucide-icon *ngIf="sortBy === 'date'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                    </div>
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let listing of listings" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ listing.title }}</div>
                      <div class="text-sm text-gray-500">{{ listing.city }}, {{ listing.country }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ listing.hostFullName }}</div>
                  <div class="text-sm text-gray-500">{{ listing.hostEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ listing.pricePerNight | currency }}
                </td>
                <!-- Status Cell - Hide when viewing unverified listings -->
                <td *ngIf="currentStatusFilter !== 'UnderReview'" class="px-6 py-4 whitespace-nowrap">
                  <select
                    [ngModel]="listing.status"
                    (ngModelChange)="updateStatus(listing, $event)"
                    class="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 rounded-md"
                    [ngClass]="{
                      'bg-green-50 text-green-800 border-green-200': listing.status === ListingStatus.Published,
                      'bg-yellow-50 text-yellow-800 border-yellow-200': listing.status === ListingStatus.UnderReview,
                      'bg-red-50 text-red-800 border-red-200': listing.status === ListingStatus.Suspended
                    }">
                    <option [value]="ListingStatus.Draft">Draft</option>
                    <option [value]="ListingStatus.Published">Published</option>
                    <option [value]="ListingStatus.Unlisted">Unlisted</option>
                    <option [value]="ListingStatus.Suspended">Suspended</option>
                    <option [value]="ListingStatus.UnderReview">Under Review</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ listing.createdAt | date:'mediumDate' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="viewListing(listing)" class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="View Details">
                    <lucide-icon [img]="icons.Eye" class="w-5 h-5"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="listings.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <lucide-icon [img]="icons.CheckCircle" class="w-12 h-12 text-gray-300 mb-2"></lucide-icon>
                        <p class="text-lg font-medium">No listings found</p>
                        <p class="text-sm">Try adjusting your filters or check back later.</p>
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
                  Previous
                </button>
                <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {{ page }} of {{ totalPages }}
                </span>
                <button (click)="onPageChange(page + 1)" [disabled]="page === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Detail Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="selectedListing?.title || 'Listing Details'" (closeEvent)="closeModal()">
        <div *ngIf="selectedListing" class="space-y-6">
            
            <!-- Header Card -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-start">
                <div>
                     <h3 class="text-lg font-bold text-gray-900">{{ selectedListing.title }}</h3>
                     <p class="text-sm text-gray-500">{{ selectedListing.city }}, {{ selectedListing.country }}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                    [ngClass]="{
                        'bg-green-100 text-green-800': selectedListing.status === ListingStatus.Published,
                        'bg-yellow-100 text-yellow-800': selectedListing.status === ListingStatus.UnderReview,
                        'bg-red-100 text-red-800': selectedListing.status === ListingStatus.Suspended
                    }">
                    {{ ListingStatus[selectedListing.status] }}
                </span>
            </div>

            <!-- Image Gallery -->
            <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Gallery</h4>
                <div *ngIf="selectedListing.imageUrls?.length" class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <img *ngFor="let img of selectedListing.imageUrls" [src]="img" class="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-200 hover:opacity-90 transition-opacity" alt="Listing Image">
                </div>
                <div *ngIf="!selectedListing.imageUrls?.length" class="text-gray-500 italic text-sm p-4 bg-gray-50 rounded-lg text-center">No images available.</div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                        <lucide-icon [img]="icons.Eye" class="w-4 h-4"></lucide-icon> Listing Details
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-gray-500">Price:</span> <span class="font-medium">{{ selectedListing.pricePerNight | currency }} / night</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Created:</span> <span class="font-medium">{{ selectedListing.createdAt | date:'mediumDate' }}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">ID:</span> <span class="font-mono text-xs">{{ selectedListing.id }}</span></div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                         <lucide-icon [img]="icons.Eye" class="w-4 h-4"></lucide-icon> Host Information
                    </h4>
                     <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-gray-500">Name:</span> <span class="font-medium">{{ selectedListing.hostFullName }}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Email:</span> <span class="font-medium text-blue-600">{{ selectedListing.hostEmail }}</span></div>
                    </div>
                </div>
            </div>
            
            <!-- Description -->
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p class="text-sm text-gray-600 leading-relaxed">{{ selectedListing.description || 'No description provided.' }}</p>
            </div>
        </div>
        
        <div footer class="flex justify-end space-x-3 w-full pt-4 border-t border-gray-100">
            <button (click)="closeModal()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                Close
            </button>
            
            <ng-container *ngIf="selectedListing?.status === ListingStatus.UnderReview">
                <button (click)="rejectListing()" 
                    class="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors flex items-center gap-2">
                    <lucide-icon [img]="icons.XCircle" class="w-4 h-4"></lucide-icon> Reject
                </button>
                <button (click)="approveListing()" 
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
                    <lucide-icon [img]="icons.CheckCircle" class="w-4 h-4"></lucide-icon> Approve & Publish
                </button>
            </ng-container>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class ListingsComponent implements OnInit, OnDestroy {
  listings: AdminListingDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  ListingStatus = ListingStatus;
  Math = Math;
  currentStatusFilter?: string;
  selectedStatusFilter: ListingStatus | null = null;

  // ADDED Filter icon
  readonly icons = { Eye, Trash2, CheckCircle, XCircle, Search, ArrowUp, ArrowDown };

  searchTerm = '';
  // Sorting State
  sortBy = 'date';
  isDescending = true;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;
  private navigationSubscription?: Subscription;

  // Modal State
  isModalOpen = false;
  selectedListing: AdminListingDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.page = 1;
      this.loadListings();
    });
  }

  ngOnInit(): void {
    // Subscribe to ALL navigation events including the initial one
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => this.router.url.startsWith('/admin/listings'))
    ).subscribe(() => {
      // Use setTimeout to ensure route data is available
      setTimeout(() => {
        this.loadRouteData();
        this.page = 1;
        this.searchTerm = '';
        this.loadListings();
      }, 0);
    });
  }

  private loadRouteData(): void {
    const currentData = this.route.snapshot.data;
    if (currentData['status']) {
      this.currentStatusFilter = currentData['status'];
      const statusKey = Object.keys(ListingStatus).find(key => 
        ListingStatus[key as keyof typeof ListingStatus] === currentData['status']
      );
      if (statusKey) {
        this.selectedStatusFilter = ListingStatus[statusKey as keyof typeof ListingStatus];
      } else {
        this.selectedStatusFilter = null;
      }
    } else {
      this.currentStatusFilter = undefined;
      this.selectedStatusFilter = null;
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
    this.navigationSubscription?.unsubscribe();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadListings();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.isDescending = !this.isDescending;
    } else {
      this.sortBy = column;
      this.isDescending = true;
    }
    this.loadListings();
  }

  loadListings(): void {
    let statusToSend: string | undefined = undefined;

    if (this.selectedStatusFilter !== null) {
      statusToSend = ListingStatus[this.selectedStatusFilter];
    } else if (this.currentStatusFilter) {
      statusToSend = this.currentStatusFilter;
    }

    this.adminService.getListings(this.page, this.pageSize, statusToSend, this.searchTerm, this.sortBy, this.isDescending).subscribe({
      next: (result) => {
        this.listings = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
      },
      error: (err) => {
        this.toastr.error('Failed to load listings', 'Error');
        console.error(err);
      }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadListings();
    }
  }

  updateStatus(listing: AdminListingDto, newStatus: any): void {
    const statusValue = Number(newStatus);
    const statusName = ListingStatus[statusValue];

    this.confirmationDialog.confirm({
      title: 'Update Status?',
      message: `Are you sure you want to change status to ${statusName}?`,
      confirmText: 'Yes, update it!',
      confirmColor: 'primary',
      icon: 'question'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.updateListingStatus(listing.id, statusValue).subscribe({
          next: () => {
            this.toastr.success('Listing status updated', 'Success');
            listing.status = statusValue;
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to update status', 'Error');
            this.loadListings();
          }
        });
      } else {
        this.loadListings();
      }
    });
  }

  deleteListing(listing: AdminListingDto): void {
    this.confirmationDialog.confirm({
      title: 'Are you sure?',
      message: `You won't be able to revert this! This listing "${listing.title}" will be permanently deleted.`,
      confirmText: 'Yes, delete it!',
      confirmColor: 'danger',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteListing(listing.id).subscribe({
          next: () => {
            this.toastr.success('Listing deleted successfully', 'Success');
            this.loadListings();
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to delete listing', 'Error');
          }
        });
      }
    });
  }

  viewListing(listing: AdminListingDto): void {
    this.selectedListing = listing;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedListing = null;
  }

  approveListing(): void {
    if (this.selectedListing) {
      this.adminService.updateListingStatus(this.selectedListing.id, ListingStatus.Published).subscribe({
        next: () => {
          this.toastr.success('Listing approved and published!', 'Success');

          if (this.currentStatusFilter === 'UnderReview') {
            this.listings = this.listings.filter(l => l.id !== this.selectedListing!.id);
            this.totalCount--;
            this.adminService.getDashboardData().subscribe();
          } else {
            const listing = this.listings.find(l => l.id === this.selectedListing!.id);
            if (listing) listing.status = ListingStatus.Published;
          }

          this.closeModal();
        },
        error: (err) => this.toastr.error('Failed to approve listing', 'Error')
      });
    }
  }

  rejectListing(): void {
    if (this.selectedListing) {
      this.adminService.updateListingStatus(this.selectedListing.id, ListingStatus.Suspended).subscribe({
        next: () => {
          this.toastr.success('Listing rejected (suspended).', 'Success');

          if (this.currentStatusFilter === 'UnderReview') {
            this.listings = this.listings.filter(l => l.id !== this.selectedListing!.id);
            this.totalCount--;
            this.adminService.getDashboardData().subscribe();
          } else {
            const listing = this.listings.find(l => l.id === this.selectedListing!.id);
            if (listing) listing.status = ListingStatus.Suspended;
          }

          this.closeModal();
        },
        error: (err) => this.toastr.error('Failed to reject listing', 'Error')
      });
    }
  }
}
