import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { LucideAngularModule, Search, Eye, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight, User, ArrowUp, ArrowDown, Key } from 'lucide-angular';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ModalComponent, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-800">User Management</h2>
        
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
            placeholder="Search users..."
          >
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" (click)="onSort('name')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    User
                    <lucide-icon *ngIf="sortBy === 'name'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                  </div>
                </th>
                <th scope="col" (click)="onSort('role')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Role
                    <lucide-icon *ngIf="sortBy === 'role'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                  </div>
                </th>
                <th scope="col" (click)="onSort('status')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Status
                    <lucide-icon *ngIf="sortBy === 'status'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                  </div>
                </th>
                <th scope="col" (click)="onSort('date')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div class="flex items-center gap-1">
                    Joined
                    <lucide-icon *ngIf="sortBy === 'date'" [img]="isDescending ? icons.ArrowDown : icons.ArrowUp" class="w-3 h-3"></lucide-icon>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users" class="align-middle">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                        {{ user.fullName.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ user.fullName }}</div>
                      <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let role of user.roles" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-green-100 text-green-800': !user.isSuspended && user.isConfirmed,
                      'bg-red-100 text-red-800': user.isSuspended,
                      'bg-yellow-100 text-yellow-800': !user.isConfirmed && !user.isSuspended
                    }">
                    {{ user.isSuspended ? 'Suspended' : (user.isConfirmed ? 'Active' : 'Pending') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.createdAt | date:'mediumDate' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-3">
                    <button (click)="viewUser(user)" class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="View Details">
                      <lucide-icon [img]="icons.Eye" class="w-5 h-5"></lucide-icon>
                    </button>
                    <button *ngIf="!user.isSuspended" (click)="suspendUser(user)" class="text-amber-600 hover:text-amber-900 p-1 hover:bg-amber-50 rounded" title="Suspend">
                      <lucide-icon [img]="icons.Ban" class="w-5 h-5"></lucide-icon>
                    </button>
                    <button *ngIf="user.isSuspended" (click)="unSuspendUser(user)" class="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded" title="Unsuspend">
                      <lucide-icon [img]="icons.CheckCircle" class="w-5 h-5"></lucide-icon>
                    </button>
                    <button (click)="resetUserPassword(user)" class="text-gray-600 hover:text-gray-900 mr-3 p-1 hover:bg-gray-50 rounded" title="Reset Password">
                      <lucide-icon [img]="icons.Key" class="w-5 h-5"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                     <div class="flex flex-col items-center justify-center">
                        <lucide-icon [img]="icons.Search" class="w-12 h-12 text-gray-300 mb-2"></lucide-icon>
                        <p class="text-lg font-medium">No users found</p>
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

      <!-- User Detail Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="selectedUser?.fullName || 'User Details'" (closeEvent)="closeModal()">
        <!-- (Modal content omitted for brevity, logic unchanged) -->
        <div *ngIf="selectedUser" class="space-y-4">
            <div class="flex items-center space-x-4 mb-6">
                <div class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-2xl">
                    {{ selectedUser.fullName.charAt(0).toUpperCase() }}
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ selectedUser.fullName }}</h3>
                    <p class="text-sm text-gray-500">{{ selectedUser.email }}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                         <lucide-icon [img]="icons.User" class="w-4 h-4"></lucide-icon> Account Info
                    </h4>
                    <div class="space-y-1">
                        <p class="text-sm text-gray-600"><span class="font-medium">ID:</span> {{ selectedUser.id }}</p>
                        <p class="text-sm text-gray-600"><span class="font-medium">Joined:</span> {{ selectedUser.createdAt | date:'medium' }}</p>
                        <p class="text-sm text-gray-600"><span class="font-medium">Status:</span> {{ selectedUser.isSuspended ? 'Suspended' : (selectedUser.isConfirmed ? 'Active' : 'Pending') }}</p>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2 mb-2">Roles</h4>
                    <div class="flex flex-wrap gap-1 mt-1">
                        <span *ngFor="let role of selectedUser.roles" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {{ role }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div footer class="flex justify-end space-x-3 w-full border-t pt-4 mt-4">
            <button (click)="closeModal()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                Close
            </button>
            <button *ngIf="selectedUser && !selectedUser.isSuspended" (click)="suspendUser(selectedUser); closeModal()" class="inline-flex items-center gap-2 justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none sm:text-sm">
                <lucide-icon [img]="icons.Ban" class="w-4 h-4"></lucide-icon> Suspend User
            </button>
            <button *ngIf="selectedUser && selectedUser.isSuspended" (click)="unSuspendUser(selectedUser); closeModal()" class="inline-flex items-center gap-2 justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:text-sm">
                 <lucide-icon [img]="icons.CheckCircle" class="w-4 h-4"></lucide-icon> Unsuspend User
            </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class UsersComponent implements OnInit, OnDestroy {
  users: AdminUserDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  Math = Math;

  readonly icons = { Search, Eye, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight, User, ArrowUp, ArrowDown, Key };

  searchTerm = '';
  sortBy = 'date';
  isDescending = true;

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;
  private routeSubscription?: Subscription;

  // Modal State
  isModalOpen = false;
  selectedUser: AdminUserDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private confirmationDialog: ConfirmationDialogService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.page = 1; // Reset to page 1 on new search
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    // Subscribe to route URL - this re-emits even when navigating to the same route
    this.routeSubscription = this.route.url.subscribe(() => {
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.isDescending = !this.isDescending;
    } else {
      this.sortBy = column;
      this.isDescending = true; // Default to Descending for new columns as it's usually what admins want (newest first)
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers(this.page, this.pageSize, this.searchTerm, this.sortBy, this.isDescending).subscribe({
      next: (result) => {
        this.users = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
      },
      error: (err) => {
        this.toastr.error('Failed to load users', 'Error');
        console.error(err);
      }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadUsers();
    }
  }

  suspendUser(user: AdminUserDto): void {
    this.confirmationDialog.confirm({
      title: 'Are you sure?',
      message: `You are about to suspend ${user.fullName}.`,
      confirmText: 'Yes, suspend!',
      confirmColor: 'danger',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.suspendUser(user.id).subscribe({
          next: () => {
            this.toastr.success('User suspended successfully', 'Success');
            this.loadUsers();
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to suspend user', 'Error');
          }
        });
      }
    });
  }

  unSuspendUser(user: AdminUserDto): void {
    this.confirmationDialog.confirm({
      title: 'Unsuspend User?',
      message: `You are about to restore access for ${user.fullName}.`,
      confirmText: 'Yes, unsuspend!',
      confirmColor: 'primary',
      icon: 'question'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.unSuspendUser(user.id).subscribe({
          next: () => {
            this.toastr.success('User unsuspended successfully', 'Success');
            this.loadUsers();
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to unsuspend user', 'Error');
          }
        });
      }
    });
  }

  deleteUser(user: AdminUserDto): void {
    this.confirmationDialog.confirm({
      title: 'Are you sure?',
      message: "You won't be able to revert this! This user will be permanently deleted.",
      confirmText: 'Yes, delete it!',
      confirmColor: 'danger',
      icon: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.toastr.success('User deleted successfully', 'Success');
            this.loadUsers();
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to delete user', 'Error');
          }
        });
      }
    });
  }

  resetUserPassword(user: AdminUserDto): void {
    this.confirmationDialog.confirm({
      title: 'Reset Password?',
      message: `Are you sure you want to reset the password for ${user.fullName}? It will be set to 'AirbnbPass@123'.`,
      confirmText: 'Yes, reset it!',
      confirmColor: 'warning', // Use warning color as it's a sensitive action
      icon: 'question'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.resetUserPassword(user.id).subscribe({
          next: () => {
            this.toastr.success(`Password for ${user.fullName} has been reset.`, 'Success');
          },
          error: (err) => {
            this.toastr.error(err.message || 'Failed to reset password', 'Error');
          }
        });
      }
    });
  }

  viewUser(user: AdminUserDto): void {
    this.selectedUser = user;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedUser = null;
  }
}
