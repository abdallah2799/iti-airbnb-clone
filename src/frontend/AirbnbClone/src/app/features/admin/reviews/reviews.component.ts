import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReviewDto } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Search, Star, Trash2, ChevronLeft, ChevronRight, User, Home, ArrowUp, ArrowDown, Ban } from 'lucide-angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';

@Component({
    selector: 'app-reviews',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './reviews.component.html',
    styles: []
})
export class ReviewsComponent implements OnInit, OnDestroy {
    private adminService = inject(AdminService);
    private toastr = inject(ToastrService);
    private confirmationDialog = inject(ConfirmationDialogService);
    private cdr = inject(ChangeDetectorRef);

    reviews: AdminReviewDto[] = [];
    page = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;
    Math = Math;

    readonly icons = { Search, Star, Trash2, ChevronLeft, ChevronRight, User, Home, ArrowUp, ArrowDown, Ban };

    searchTerm = '';
    // Sorting State
    sortBy = 'date';
    isDescending = true;

    private searchSubject = new Subject<string>();
    private searchSubscription: Subscription;

    constructor() {
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(term => {
            this.page = 1;
            this.loadReviews();
        });
    }

    ngOnInit(): void {
        this.loadReviews();
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
        this.loadReviews();
    }

    loadReviews(): void {
        this.adminService.getReviews(this.page, this.pageSize, this.searchTerm, this.sortBy, this.isDescending).subscribe({
            next: (result) => {
                this.reviews = result.items;
                this.totalCount = result.totalCount;
                this.totalPages = result.totalPages;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastr.error('Failed to load reviews', 'Error');
                console.error(err);
            }
        });
    }

    onPageChange(newPage: number): void {
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.page = newPage;
            this.loadReviews();
        }
    }

    deleteReview(reviewId: number): void {
        this.confirmationDialog.confirm({
            title: 'Delete Review?',
            message: "Are you sure you want to delete this review? This action cannot be undone.",
            confirmText: 'Yes, delete it!',
            confirmColor: 'danger',
            icon: 'warning'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.adminService.deleteReview(reviewId).subscribe({
                    next: () => {
                        this.toastr.success('Review deleted successfully', 'Success');
                        this.loadReviews();
                    },
                    error: (err) => {
                        this.toastr.error(err.message || 'Failed to delete review', 'Error');
                    }
                });
            }
        });
    }

    suspendAuthor(userId: string): void {
        this.confirmationDialog.confirm({
            title: 'Suspend User?',
            message: "Are you sure you want to suspend this user?",
            confirmText: 'Yes, suspend!',
            confirmColor: 'danger',
            icon: 'warning'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.adminService.suspendUser(userId).subscribe({
                    next: () => {
                        this.toastr.success('User suspended successfully', 'Success');
                        this.loadReviews();
                    },
                    error: (err) => {
                        this.toastr.error(err.message || 'Failed to suspend user', 'Error');
                    }
                });
            }
        });
    }
}
