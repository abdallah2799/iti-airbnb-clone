import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface WishlistItem {
    id: number;
    listingId: number;
    listing: any; // We can refine this type later if needed
}

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/wishlist`;

    // Signal to track wishlist listing IDs for O(1) lookup
    wishlistIds = signal<Set<number>>(new Set<number>());

    constructor() {
        // Optionally load wishlist on startup if user is logged in
        // For now, we'll rely on components calling getWishlist()
    }

    getWishlist(): Observable<WishlistItem[]> {
        return this.http.get<WishlistItem[]>(this.apiUrl).pipe(
            tap(items => {
                const ids = new Set(items.map(item => item.listingId));
                this.wishlistIds.set(ids);
            })
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
