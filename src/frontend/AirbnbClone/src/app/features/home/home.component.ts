// home.component.ts
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Listing, PropertyType } from '../../core/models/listing.interface';
import { ListingService } from '../../core/services/listing.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule,RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [ListingService]
})
export class HomeComponent implements AfterViewInit, OnInit {
  listings: Listing[] = [];
  loading = true;
  error = '';

  canScrollLeft = false;
  canScrollRight = false;

  constructor(private listingService: ListingService) {}

  ngOnInit(): void {
    this.loadListings();
  }

  ngAfterViewInit(): void {
    this.updateScrollButtons();
  }

  loadListings(): void {
    this.loading = true;
    this.error = '';

    this.listingService.getPublishedListings().subscribe({
      next: (listings) => {
        this.listings = listings;
        this.loading = false;
        
        // Update scroll buttons after data loads
        setTimeout(() => this.updateScrollButtons(), 100);
      },
      error: (error) => {
        this.error = 'Failed to load listings. Please try again later.';
        this.loading = false;
        console.error('Error loading listings:', error);
      }
    });
  }

  toggleFavorite(listing: Listing, event: Event): void {
    event.stopPropagation();
    // Since the API doesn't include favorite status, we'll add it locally
    if (!('isFavorite' in listing)) {
      listing.isFavorite = false;
    }
    listing.isFavorite = !listing.isFavorite;
  }

  scrollCarousel(direction: 'left' | 'right'): void {
    const carousel = document.getElementById('carousel');
    const scrollAmount = 320;
    
    if (carousel) {
      if (direction === 'left') {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(() => this.updateScrollButtons(), 300);
    }
  }

  onCarouselScroll(): void {
    this.updateScrollButtons();
  }

  private updateScrollButtons(): void {
    const carousel = document.getElementById('carousel');
    if (carousel) {
      this.canScrollLeft = carousel.scrollLeft > 0;
      this.canScrollRight = carousel.scrollLeft < (carousel.scrollWidth - carousel.clientWidth - 10);
    }
  }

  // Helper methods to format data for display
  getPropertyTypeText(propertyType: number): string {
    switch (propertyType) {
      case PropertyType.Apartment: return 'Apartment';
      case PropertyType.House: return 'House';
      case PropertyType.Villa: return 'Villa';
      case PropertyType.Studio: return 'Studio';
      case PropertyType.Room: return 'Room';
      default: return 'Property';
    }
  }

  getLocationText(listing: Listing): string {
    return `${listing.city}, ${listing.country}`;
  }

  getRatingText(listing: Listing): string {
    if (listing.reviewCount === 0) {
      return 'New';
    }
    return `★ ${listing.averageRating.toFixed(1)} (${listing.reviewCount})`;
  }

  getPriceText(listing: Listing): string {
    return `${listing.pricePerNight} ${listing.currency}`;
  }
}