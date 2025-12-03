import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Star, MessageSquare } from 'lucide-angular';
import { ReviewService } from 'src/app/core/services/review.service';
import { ReviewDto } from 'src/app/core/models/review.model';

@Component({
    selector: 'app-host-reviews',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './host-reviews.component.html',
    styleUrls: ['./host-reviews.component.css']
})
export class HostReviewsComponent implements OnInit {
    private reviewService = inject(ReviewService);

    reviews = signal<ReviewDto[]>([]);
    isLoading = signal<boolean>(true);

    readonly icons = { Star, MessageSquare };

    ngOnInit() {
        this.loadReviews();
    }

    loadReviews() {
        this.isLoading.set(true);
        this.reviewService.getHostReviews().subscribe({
            next: (data) => {
                this.reviews.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading host reviews:', err);
                this.isLoading.set(false);
            }
        });
    }
}
