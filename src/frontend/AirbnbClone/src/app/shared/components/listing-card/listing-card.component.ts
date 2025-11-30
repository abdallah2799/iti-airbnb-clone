import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Listing, PropertyType } from '../../../core/models/listing.interface';

@Component({
    selector: 'app-listing-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="group cursor-pointer">
      <a [routerLink]="['/rooms', listing.id]" class="block">
        <div class="relative overflow-hidden rounded-xl mb-3 aspect-[20/19]">
          <img
            [src]="listing.coverPhotoUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'"
            [alt]="listing.title"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          <button 
            (click)="toggleFavorite($event)"
            class="absolute top-3 right-3 p-2 hover:scale-110 transition z-10"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 32 32" 
              aria-hidden="true" 
              role="presentation" 
              focusable="false"
              class="block h-6 w-6 stroke-white stroke-[2px] overflow-visible"
              [class.fill-[#FF385C]]="listing.isFavorite"
              [class.fill-black]="!listing.isFavorite && false" 
              [style.fill]="listing.isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.5)'"
            >
              <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
            </svg>
          </button>

          <div *ngIf="listing.isSuperHost" class="absolute top-3 left-3 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
            Guest favorite
          </div>
        </div>

        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-gray-900 text-[15px] leading-5">{{ listing.city }}, {{ listing.country }}</h3>
            <p class="text-gray-500 text-[15px] leading-5 mt-0.5">
              {{ getPropertyTypeText(listing.propertyType) }}
            </p>
            <p class="text-gray-500 text-[15px] leading-5 mt-0.5">
              {{ listing.numberOfBedrooms }} beds
            </p>
            <div class="flex items-baseline gap-1 mt-1.5">
              <span class="font-semibold text-gray-900 text-[15px]">\${{ listing.pricePerNight }}</span>
              <span class="text-gray-900 text-[15px]">night</span>
            </div>
          </div>
          
          <div class="flex items-center gap-1 text-[15px]">
            <span class="text-xs">★</span>
            <span>{{ listing.averageRating ? listing.averageRating.toFixed(2) : 'New' }}</span>
          </div>
        </div>
      </a>
    </div>
  `
})
export class ListingCardComponent {
    @Input({ required: true }) listing!: Listing;

    toggleFavorite(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        // Toggle logic here or emit event
        if (!('isFavorite' in this.listing)) {
            (this.listing as any).isFavorite = false;
        }
        (this.listing as any).isFavorite = !(this.listing as any).isFavorite;
    }

    getPropertyTypeText(type: PropertyType): string {
        switch (type) {
            case PropertyType.Apartment: return 'Apartment';
            case PropertyType.House: return 'House';
            case PropertyType.Villa: return 'Villa';
            case PropertyType.Studio: return 'Studio';
            case PropertyType.Room: return 'Room';
            default: return 'Stay';
        }
    }
}
