import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Star } from 'lucide-angular';
import { ReviewDto } from 'src/app/features/host/models/listing-details.model';

@Component({
    selector: 'app-review-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './review-list.component.html',
    styleUrls: ['./review-list.component.css']
})
export class ReviewListComponent implements OnChanges {
    @Input() reviews: ReviewDto[] = [];

    readonly icons = { Star };

    averageRating = signal<number>(0);
    ratingBreakdown = signal<{ [key: string]: number }>({});

    ngOnChanges(changes: SimpleChanges) {
        if (changes['reviews'] && this.reviews) {
            this.calculateStats();
        }
    }

    private calculateStats() {
        if (!this.reviews.length) {
            this.averageRating.set(0);
            this.ratingBreakdown.set({});
            return;
        }

        const total = this.reviews.length;
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        this.averageRating.set(sum / total);

        // Calculate detailed breakdown
        const categories = ['cleanlinessRating', 'accuracyRating', 'communicationRating', 'locationRating', 'checkInRating', 'valueRating'];
        const breakdown: any = {};

        categories.forEach(cat => {
            // Filter out reviews that might not have this rating (though they should)
            const validReviews = this.reviews.filter(r => (r as any)[cat] !== undefined && (r as any)[cat] !== null);
            if (validReviews.length > 0) {
                const catSum = validReviews.reduce((acc, r) => acc + ((r as any)[cat] || 0), 0);
                breakdown[cat] = catSum / validReviews.length;
            } else {
                breakdown[cat] = 0;
            }
        });

        this.ratingBreakdown.set(breakdown);
    }

    getCategoryLabel(key: string): string {
        console.log(this.reviews[0].guest);
        const map: { [key: string]: string } = {
            'cleanlinessRating': 'Cleanliness',
            'accuracyRating': 'Accuracy',
            'communicationRating': 'Communication',
            'locationRating': 'Location',
            'checkInRating': 'Check-in',
            'valueRating': 'Value'
        };
        return map[key] || key;
    }

    handleImageError(event: any) {
        event.target.src = 'https://a0.muscache.com/defaults/user_pic-225x225.png';
    }
}
