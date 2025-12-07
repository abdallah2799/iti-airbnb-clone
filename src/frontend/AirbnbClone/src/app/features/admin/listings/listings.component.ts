import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminListingDto, ListingStatus } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LucideAngularModule, Eye, Trash2, CheckCircle, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">
          {{ currentStatusFilter === 'UnderReview' ? 'Unverified Listings' : 'Listing Management' }}
        </h2>
      </div>

      <!-- Listings Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
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
                <td class="px-6 py-4 whitespace-nowrap">
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
                  <button (click)="viewListing(listing)" class="text-blue-600 hover:text-blue-900 mr-3 p-1 hover:bg-blue-50 rounded" title="View Details">
                    <lucide-icon [img]="icons.Eye" class="w-5 h-5"></lucide-icon>
                  </button>
                  <button (click)="deleteListing(listing)" class="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Delete">
                    <lucide-icon [img]="icons.Trash2" class="w-5 h-5"></lucide-icon>
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
export class ListingsComponent implements OnInit {
  listings: AdminListingDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  ListingStatus = ListingStatus;
  Math = Math;
  currentStatusFilter?: string;
  readonly icons = { Eye, Trash2, CheckCircle, XCircle };

  // Modal State
  isModalOpen = false;
  selectedListing: AdminListingDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['status']) {
        this.currentStatusFilter = data['status'];
      } else {
        this.currentStatusFilter = undefined;
      }
      this.loadListings();
    });
  }

  loadListings(): void {
    this.adminService.getListings(this.page, this.pageSize, this.currentStatusFilter).subscribe({
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
  }

  deleteListing(listing: AdminListingDto): void {
    if (confirm(`Are you sure you want to delete listing "${listing.title}"? This cannot be undone.`)) {
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

          // Real-time UI Update
          if (this.currentStatusFilter === 'UnderReview') {
            // Remove from list immediately
            this.listings = this.listings.filter(l => l.id !== this.selectedListing!.id);
            this.totalCount--;

            // Update Sidebar Count via Service
            // We need to get the current count from the service first, or just decrement it blindly?
            // The service holds the subject. We can subscribe to take(1) or just decrement if we track it.
            // Better: The component doesn't know the global count, but it knows it removed one unverified listing.
            // We can assume the service's current value needs to be decremented.
            // However, we don't have direct access to the Subject's value in the service public API.
            // Let's rely on re-fetching the dashboard data OR add a method to decrement.
            // For now, let's just trigger a reload of stats in the background or optimistically update if we can.
            // Since we added `updateUnverifiedCount` to the service, let's use it if we can get the current value.
            // Actually, `adminService.unverifiedCount$` is an observable.
            // Let's just fetch the dashboard data again silently to be safe and accurate.
            this.adminService.getDashboardData().subscribe();
          } else {
            // Just update the status in the list
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
            this.adminService.getDashboardData().subscribe(); // Sync sidebar
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
