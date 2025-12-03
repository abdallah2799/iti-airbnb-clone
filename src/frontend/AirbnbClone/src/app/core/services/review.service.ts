import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { CreateReviewDto, ListingReviewsDto, ReviewDto } from '../models/review.model';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/reviews`;

    createReview(review: CreateReviewDto): Observable<ReviewDto> {
        return this.http.post<ReviewDto>(this.apiUrl, review);
    }

    getListingReviews(listingId: number): Observable<ListingReviewsDto> {
        return this.http.get<ListingReviewsDto>(`${this.apiUrl}/listing/${listingId}`);
    }

    getUserReviews(): Observable<ReviewDto[]> {
        return this.http.get<ReviewDto[]>(`${this.apiUrl}/my-reviews`);
    }

    getHostReviews(): Observable<ReviewDto[]> {
        return this.http.get<ReviewDto[]>(`${this.apiUrl}/host/my-reviews`);
    }

    canReview(bookingId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/can-review/${bookingId}`);
    }
}
