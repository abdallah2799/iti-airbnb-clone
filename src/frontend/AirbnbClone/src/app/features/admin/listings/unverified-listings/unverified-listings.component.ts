import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminListingDto, ListingStatus } from '../../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { LucideAngularModule, Eye, Trash2, CheckCircle, XCircle, Search, ArrowUp, ArrowDown } from 'lucide-angular';
import { ConfirmationDialogService } from '../../../../core/services/confirmation-dialog.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-unverified-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-800">Unverified Listings</h2>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
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
              @for (listing of listings; track listing.id) {
                <tr class="hover:bg-gray-50 transition-colors">
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ listing.createdAt | date:'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="viewListing(listing)" class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="View Details">
                      <lucide-icon [img]="icons.Eye" class="w-5 h-5"></lucide-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center">
                          <lucide-icon [img]="icons.CheckCircle" class="w-12 h-12 text-gray-300 mb-2"></lucide-icon>
                          <p class="text-lg font-medium">No unverified listings found</p>
                          <p class="text-sm">All listings have been reviewed.</p>
                      </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button (click)="onPageChange(page - 1)" [disabled]="page === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button (click)="onPageChange(page + 1)" [disabled]="page === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (page - 1) * pageSize + 1 }}</span> to
                <span class="font-medium">{{ Math.min(page * pageSize, totalCount) }}</span> of
                <span class="font-medium">{{ totalCount }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="onPageChange(page - 1)" [disabled]="page === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                @for (p of [].constructor(totalPages); track $index; let i = $index) {
                  <button (click)="onPageChange(i + 1)"
                    [class]="(i + 1) === page ? 'z-10 bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    {{ i + 1 }}
                  </button>
                }
                <button (click)="onPageChange(page + 1)" [disabled]="page === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <app-modal [isOpen]="isModalOpen" (closeEvent)="closeModal()" [title]="'Listing Details'">
        <div body class="space-y-6" *ngIf="selectedListing">
            <!-- Images Gallery -->
            <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Images</h4>
                <div *ngIf="selectedListing.imageUrls?.length" class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    @for (img of selectedListing.imageUrls; track img) {
                      <img [src]="img" class="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-200 hover:opacity-90 transition-opacity" alt="Listing Image">
                    }
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
            
            <button (click)="rejectListing()" 
                class="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors flex items-center gap-2">
                <lucide-icon [img]="icons.XCircle" class="w-4 h-4"></lucide-icon> Reject
            </button>
            <button (click)="approveListing()" 
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
                <lucide-icon [img]="icons.CheckCircle" class="w-4 h-4"></lucide-icon> Approve & Publish
            </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class UnverifiedListingsComponent implements OnInit, OnDestroy {
  listings: AdminListingDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  ListingStatus = ListingStatus;
  Math = Math;

  readonly icons = { Eye, Trash2, CheckCircle, XCircle, Search, ArrowUp, ArrowDown };

  searchTerm = '';
  sortBy = 'date';
  isDescending = true;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;

  isModalOpen = false;
  selectedListing: AdminListingDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private router: Router,
    private confirmationDialog: ConfirmationDialogService,
    private cdr: ChangeDetectorRef
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
    this.loadListings();
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
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
    // Always filter by UnderReview status
    const status = 'UnderReview';

    this.adminService.getListings(this.page, this.pageSize, status, this.searchTerm, this.sortBy, this.isDescending).subscribe({
      next: (result) => {
        this.listings = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Failed to load unverified listings', 'Error');
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

  viewListing(listing: AdminListingDto): void {
    this.selectedListing = listing;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedListing = null;
  }

  approveListing(): void {
    if (!this.selectedListing) return;

    this.confirmationDialog.confirm({
      title: 'Approve Listing?',
      message: 'This will publish the listing and make it visible to users.',
      confirmText: 'Yes, approve it!',
      confirmColor: 'primary',
      icon: 'question'
    }).subscribe(confirmed => {
      if (confirmed && this.selectedListing) {
        this.adminService.updateListingStatus(this.selectedListing.id, ListingStatus.Published).subscribe({
          next: () => {
            this.toastr.success('Listing approved and published', 'Success');
            this.closeModal();
            this.loadListings();
          },
          error: (err) => {
            this.toastr.error('Failed to approve listing', 'Error');
            console.error(err);
          }
        });
      }
    });
  }

  rejectListing(): void {
    if (!this.selectedListing) return;

    this.confirmationDialog.confirm({
      title: 'Reject Listing?',
      message: 'This will suspend the listing and notify the host.',
      confirmText: 'Yes, reject it!',
      confirmColor: 'danger',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed && this.selectedListing) {
        this.adminService.updateListingStatus(this.selectedListing.id, ListingStatus.Suspended).subscribe({
          next: () => {
            this.toastr.success('Listing rejected', 'Success');
            this.closeModal();
            this.loadListings();
          },
          error: (err) => {
            this.toastr.error('Failed to reject listing', 'Error');
            console.error(err);
          }
        });
      }
    });
  }
}
