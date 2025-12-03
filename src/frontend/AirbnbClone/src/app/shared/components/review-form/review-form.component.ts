import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Star, X } from 'lucide-angular';
import { ReviewService } from 'src/app/core/services/review.service';
import { CreateReviewDto } from 'src/app/core/models/review.model';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-review-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './review-form.component.html',
    styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent {
    @Input() bookingId!: number;
    @Input() listingId!: number;
    @Output() close = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<void>();

    private reviewService = inject(ReviewService);
    private toastr = inject(ToastrService);

    readonly icons = { Star, X };

    isSubmitting = signal<boolean>(false);

    // Form Data
    comment = '';
    ratings: { [key: string]: number } = {
        cleanliness: 0,
        accuracy: 0,
        communication: 0,
        location: 0,
        checkIn: 0,
        value: 0
    };

    categories = [
        { key: 'cleanliness', label: 'Cleanliness', description: 'Was the space clean?' },
        { key: 'accuracy', label: 'Accuracy', description: 'Did the listing match the description?' },
        { key: 'communication', label: 'Communication', description: 'How clearly did the host communicate?' },
        { key: 'location', label: 'Location', description: 'Was the location as described?' },
        { key: 'checkIn', label: 'Check-in', description: 'How easy was the check-in process?' },
        { key: 'value', label: 'Value', description: 'Was it worth the price?' }
    ];

    setRating(category: string, value: number) {
        this.ratings[category] = value;
    }

    submitReview() {
        // Validation
        if (!this.comment.trim()) {
            this.toastr.warning('Please write a review comment');
            return;
        }

        const missingRating = Object.values(this.ratings).some(r => r === 0);
        if (missingRating) {
            this.toastr.warning('Please rate all categories');
            return;
        }

        this.isSubmitting.set(true);

        const reviewDto: CreateReviewDto = {
            bookingId: this.bookingId,
            listingId: this.listingId,
            rating: this.calculateOverallRating(),
            cleanlinessRating: this.ratings['cleanliness'],
            accuracyRating: this.ratings['accuracy'],
            communicationRating: this.ratings['communication'],
            locationRating: this.ratings['location'],
            checkInRating: this.ratings['checkIn'],
            valueRating: this.ratings['value'],
            comment: this.comment
        };

        this.reviewService.createReview(reviewDto).subscribe({
            next: () => {
                this.toastr.success('Review submitted successfully');
                this.isSubmitting.set(false);
                this.submitted.emit();
                this.close.emit();
            },
            error: (err) => {
                console.error('Error submitting review:', err);
                this.toastr.error(err.error?.message || 'Failed to submit review');
                this.isSubmitting.set(false);
            }
        });
    }

    calculateOverallRating(): number {
        const sum = Object.values(this.ratings).reduce((a, b) => a + b, 0);
        return Math.round(sum / 6);
    }
}
