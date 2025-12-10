import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">User Management</h2>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users">
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
                  <button (click)="viewUser(user)" class="text-blue-600 hover:text-blue-900 mr-4" title="View Details">
                    <span class="material-icons text-base">visibility</span>
                  </button>
                  <button *ngIf="!user.isSuspended" (click)="suspendUser(user)" class="text-amber-600 hover:text-amber-900 mr-4" title="Suspend">
                    <span class="material-icons text-base">block</span>
                  </button>
                  <button *ngIf="user.isSuspended" (click)="unSuspendUser(user)" class="text-green-600 hover:text-green-900 mr-4" title="Unsuspend">
                    <span class="material-icons text-base">check_circle</span>
                  </button>
                  <button (click)="deleteUser(user)" class="text-red-600 hover:text-red-900" title="Delete">
                    <span class="material-icons text-base">delete</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  No users found.
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

      <!-- User Detail Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="selectedUser?.fullName || 'User Details'" (closeEvent)="closeModal()">
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
                <div>
                    <h4 class="font-semibold text-gray-700">Account Info</h4>
                    <p class="text-sm text-gray-600"><span class="font-medium">ID:</span> {{ selectedUser.id }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Joined:</span> {{ selectedUser.createdAt | date:'medium' }}</p>
                    <p class="text-sm text-gray-600"><span class="font-medium">Status:</span> {{ selectedUser.isSuspended ? 'Suspended' : (selectedUser.isConfirmed ? 'Active' : 'Pending') }}</p>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-700">Roles</h4>
                    <div class="flex flex-wrap gap-1 mt-1">
                        <span *ngFor="let role of selectedUser.roles" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {{ role }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div footer class="flex justify-end space-x-3 w-full">
            <button *ngIf="selectedUser && !selectedUser.isSuspended" (click)="suspendUser(selectedUser); closeModal()" class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:text-sm">
                Suspend User
            </button>
            <button *ngIf="selectedUser && selectedUser.isSuspended" (click)="unSuspendUser(selectedUser); closeModal()" class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm">
                Unsuspend User
            </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: []
})
export class UsersComponent implements OnInit {
  users: AdminUserDto[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  Math = Math;

  // Modal State
  isModalOpen = false;
  selectedUser: AdminUserDto | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers(this.page, this.pageSize).subscribe({
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
    if (confirm(`Are you sure you want to suspend ${user.fullName}?`)) {
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
  }

  unSuspendUser(user: AdminUserDto): void {
    if (confirm(`Are you sure you want to unsuspend ${user.fullName}?`)) {
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
  }

  deleteUser(user: AdminUserDto): void {
    if (confirm(`Are you sure you want to delete ${user.fullName}? This cannot be undone.`)) {
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
