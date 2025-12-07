import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReviewDto, PagedResult } from '../../../core/models/admin.interfaces';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-reviews',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reviews.component.html',
    styles: []
})
export class ReviewsComponent implements OnInit {
    private adminService = inject(AdminService);
    private toastr = inject(ToastrService);

    reviews: AdminReviewDto[] = [];
    totalCount = 0;
    currentPage = 1;
    pageSize = 10;
    loading = false;

    ngOnInit(): void {
        this.loadReviews();
    }

    loadReviews(): void {
        this.loading = true;
        this.adminService.getReviews(this.currentPage, this.pageSize).subscribe({
            next: (result: PagedResult<AdminReviewDto>) => {
                this.reviews = result.items;
                this.totalCount = result.totalCount;
                this.loading = false;
            },
            error: (err) => {
                this.toastr.error('Failed to load reviews', 'Error');
                this.loading = false;
            }
        });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadReviews();
    }

    deleteReview(id: number): void {
        if (confirm('Are you sure you want to delete this review?')) {
            this.adminService.deleteReview(id).subscribe({
                next: () => {
                    this.toastr.success('Review deleted successfully');
                    this.loadReviews();
                },
                error: (err) => {
                    this.toastr.error(err.message || 'Failed to delete review', 'Error');
                }
            });
        }
    }

    suspendAuthor(id: number): void {
        if (confirm('Are you sure you want to suspend the author of this review?')) {
            this.adminService.suspendReviewAuthor(id).subscribe({
                next: () => {
                    this.toastr.success('Author suspended successfully');
                },
                error: (err) => {
                    this.toastr.error(err.message || 'Failed to suspend author', 'Error');
                }
            });
        }
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    get pages(): number[] {
        const pagesArray = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pagesArray.push(i);
        }
        return pagesArray;
    }
}
