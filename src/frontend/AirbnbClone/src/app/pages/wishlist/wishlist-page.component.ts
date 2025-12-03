import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService, WishlistItem } from '../../core/services/wishlist.service';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-wishlist-page',
    standalone: true,
    imports: [CommonModule, ListingCardComponent, RouterModule],
    template: `
    <div class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[2520px] mx-auto">
      <h1 class="text-3xl font-bold mb-8">Wishlist</h1>

      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      } @else if (wishlistItems().length === 0) {
        <div class="flex flex-col items-center justify-center h-[60vh] text-center">
          <h2 class="text-2xl font-semibold mb-4">No items saved yet</h2>
          <p class="text-gray-500 mb-8">As you search, click the heart icon to save your favorite places.</p>
          <a routerLink="/" class="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
            Start exploring
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          @for (item of wishlistItems(); track item.id) {
            <app-listing-card [listing]="item.listing"></app-listing-card>
          }
        </div>
      }
    </div>
  `,
    styles: []
})
export class WishlistPageComponent implements OnInit {
    private wishlistService = inject(WishlistService);

    wishlistItems = signal<WishlistItem[]>([]);
    loading = signal<boolean>(true);

    ngOnInit() {
        this.loadWishlist();
    }

    loadWishlist() {
        this.wishlistService.getWishlist().subscribe({
            next: (items) => {
                this.wishlistItems.set(items);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load wishlist', err);
                this.loading.set(false);
            }
        });
    }
}
