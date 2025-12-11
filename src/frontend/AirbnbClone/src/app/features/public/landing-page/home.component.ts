import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ListingService } from 'src/app/core/services/listing.service';
import { Listing } from 'src/app/core/models/listing.interface';
import { ListingRowComponent } from '../../../shared/components/listing-row/listing-row.component';
import { ListingCardComponent } from '../../../shared/components/listing-card/listing-card.component';

interface CityRow {
  title: string;
  items: Listing[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, ListingRowComponent, ListingCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [ListingService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  listings: Listing[] = [];
  cityRows: CityRow[] = [];
  remainingListings: Listing[] = [];

  loading = true;
  error = '';

  constructor(
    private listingService: ListingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.listingService.getPublishedListings().subscribe({
      next: (listings) => {
        this.listings = listings;
        this.processListings(listings);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = 'Failed to load listings. Please try again later.';
        this.loading = false;
        this.cdr.markForCheck();
        console.error('Error loading listings:', error);
      }
    });
  }

  private processListings(listings: Listing[]) {
    // Group by city
    const cityGroups = listings.reduce((acc, listing) => {
      const city = listing.city || 'Other';
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(listing);
      return acc;
    }, {} as Record<string, Listing[]>);

    // Sort cities by number of listings
    const sortedCities = Object.entries(cityGroups)
      .sort(([, a], [, b]) => b.length - a.length);

    // Take top 3 cities for rows, limit to 10 items per row for performance
    this.cityRows = sortedCities.slice(0, 3).map(([city, items]) => ({
      title: `Stays in ${city}`,
      items: items.slice(0, 10) // Only show first 10 per city
    }));

    // Put first 12 listings in "More to explore" 
    this.remainingListings = listings.slice(0, 12);
  }
}