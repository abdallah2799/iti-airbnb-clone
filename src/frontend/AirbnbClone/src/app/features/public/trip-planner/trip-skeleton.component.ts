import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-trip-skeleton',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trip-skeleton.component.html',
    styleUrl: './trip-skeleton.component.scss'
})
export class TripSkeletonComponent {
    // Generate arrays for skeleton items
    itineraryDays = Array(5).fill(0);
    lodgingCards = Array(4).fill(0);
    activityItems = Array(4).fill(0);
}
