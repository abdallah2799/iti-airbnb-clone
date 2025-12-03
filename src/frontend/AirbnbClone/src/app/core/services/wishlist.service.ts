import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface WishlistItem {
    id: number;
    listingId: number;
    listing: any; // Using any to allow flexible mapping, or define a partial Listing interface
}

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/wishlist`;

    // Signal to track wishlist listing IDs for O(1) lookup
    wishlistIds = signal<Set<number>>(new Set<number>());

    constructor() { }

    getWishlist(): Observable<WishlistItem[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            tap(items => {
                const ids = new Set(items.map(item => item.listingId));
                this.wishlistIds.set(ids);
            }),
            map(items => items.map(item => ({
                id: item.listingId,
                listingId: item.listingId,
                listing: {
                    id: item.listingId,
                    title: item.title,
                    coverPhotoUrl: item.coverPhotoUrl,
                    pricePerNight: item.price,
                    averageRating: item.averageRating,
                    reviewCount: item.reviewCount,
                    city: item.city,
                    country: item.country,
                    propertyType: item.propertyType,
                    numberOfBedrooms: item.numberOfBedrooms,
                    isSuperHost: item.isSuperHost,
                    currency: 'USD',
                    maxGuests: 0,
                    numberOfBathrooms: 0,
                    hostName: '',
                    isFavorite: true
                }
            })))
        );
    }

    addToWishlist(listingId: number): Observable<any> {
        // Optimistic update
        this.wishlistIds.update(ids => {
            const newIds = new Set(ids);
            newIds.add(listingId);
            return newIds;
        });

        return this.http.post(this.apiUrl, { listingId }).pipe(
            tap({
                error: () => {
                    // Revert on error
                    this.wishlistIds.update(ids => {
                        const newIds = new Set(ids);
                        newIds.delete(listingId);
                        return newIds;
                    });
                }
            })
        );
    }

    removeFromWishlist(listingId: number): Observable<any> {
        // Optimistic update
        this.wishlistIds.update(ids => {
            const newIds = new Set(ids);
            newIds.delete(listingId);
            return newIds;
        });

        return this.http.delete(`${this.apiUrl}/${listingId}`).pipe(
            tap({
                error: () => {
                    // Revert on error
                    this.wishlistIds.update(ids => {
                        const newIds = new Set(ids);
                        newIds.add(listingId);
                        return newIds;
                    });
                }
            })
        );
    }

    isInWishlist(listingId: number): boolean {
        return this.wishlistIds().has(listingId);
    }
}
