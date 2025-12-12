import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto, PagedResult } from '../../../core/models/admin.interfaces';
import { LucideAngularModule, Search, Plus, Trash2, Shield } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { AddAdminModalComponent } from './add-admin-modal/add-admin-modal.component';

@Component({
    selector: 'app-admins',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, AddAdminModalComponent],
    templateUrl: './admins.component.html',
    styleUrl: './admins.component.css'
})
export class AdminsComponent implements OnInit {
    admins: AdminUserDto[] = [];
    isLoading = false;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;

    // Sorting
    sortBy = 'createdAt';
    isDescending = true;

    // Modal
    showAddModal = false;

    readonly icons = { Search, Plus, Trash2, Shield };
    readonly Math = Math; // Expose Math to template

    private adminService = inject(AdminService);
    private toastr = inject(ToastrService);

    ngOnInit() {
        this.loadAdmins();
    }

    loadAdmins() {
        this.isLoading = true;
        this.adminService.getAdmins(
            this.currentPage,
            this.pageSize,
            undefined,
            this.sortBy,
            this.isDescending
        ).subscribe({
            next: (result: PagedResult<AdminUserDto>) => {
                this.admins = result.items;
                this.totalCount = result.totalCount;
                this.totalPages = result.totalPages;
                this.isLoading = false;
            },
            error: (err: Error) => {
                console.error('Error loading admins:', err);
                this.toastr.error(err.message || 'Failed to load admins', 'Error');
                this.isLoading = false;
            }
        });
    }

    onSort(column: string) {
        if (this.sortBy === column) {
            this.isDescending = !this.isDescending;
        } else {
            this.sortBy = column;
            this.isDescending = false;
        }
        this.loadAdmins();
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadAdmins();
    }

    openAddModal() {
        this.showAddModal = true;
    }

    closeAddModal() {
        this.showAddModal = false;
    }

    onAdminCreated() {
        this.showAddModal = false;
        this.loadAdmins(); // Refresh the list
    }

    deleteAdmin(admin: AdminUserDto) {
        if (confirm(`Are you sure you want to delete admin "${admin.fullName}"? This will suspend their account.`)) {
            this.adminService.deleteAdmin(admin.id).subscribe({
                next: () => {
                    this.toastr.success(`Admin "${admin.fullName}" deleted successfully`, 'Success');
                    this.loadAdmins();
                },
                error: (err: Error) => {
                    console.error('Error deleting admin:', err);
                    this.toastr.error(err.message || 'Failed to delete admin', 'Error');
                }
            });
        }
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
}
