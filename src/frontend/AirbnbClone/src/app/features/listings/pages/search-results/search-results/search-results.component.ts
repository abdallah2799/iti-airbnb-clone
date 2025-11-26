import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ListingService } from '../../../services/listing.service';
import { Listing } from '../../../../../core/models/listing.interface';


@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-results.component.html',
styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private listingService = inject(ListingService);

  listings = signal<Listing[]>([]);
  isLoading = signal<boolean>(true);
  
  searchParams = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchParams = {
        location: params['location'] || '',
        checkIn: params['checkIn'] || '',
        checkOut: params['checkOut'] || '',
        guests: Number(params['guests']) || 0
      };
      
      this.performSearch();
    });
  }

  performSearch(): void {
    this.isLoading.set(true);

    // Priority: Dates > Location > Guests > All
    if (this.searchParams.checkIn && this.searchParams.checkOut) {
      this.searchByDates();
    } else if (this.searchParams.location) {
      this.searchByLocation();
    } else if (this.searchParams.guests > 0) {
      this.searchByGuests();
    } else {
      this.loadAllListings();
    }
  }

  searchByDates(): void {
    this.listingService.filterByDates(
      this.searchParams.checkIn, 
      this.searchParams.checkOut
    ).subscribe({
      next: (results) => {
        let filtered = results;
        
        // Apply additional filters client-side
        if (this.searchParams.location) {
          filtered = this.filterByLocation(filtered, this.searchParams.location);
        }
        
        if (this.searchParams.guests > 0) {
          filtered = filtered.filter(l => l.maxGuests >= this.searchParams.guests);
        }
        
        this.listings.set(filtered);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      }
    });
  }

  searchByLocation(): void {
    this.listingService.searchByLocation(this.searchParams.location).subscribe({
      next: (results) => {
        let filtered = results;
        
        if (this.searchParams.guests > 0) {
          filtered = filtered.filter(l => l.maxGuests >= this.searchParams.guests);
        }
        
        this.listings.set(filtered);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      }
    });
  }

  searchByGuests(): void {
    this.listingService.filterByGuests(this.searchParams.guests).subscribe({
      next: (results) => {
        this.listings.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadAllListings(): void {
    this.listingService.getAllListings().subscribe({
      next: (results) => {
        this.listings.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading listings:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Client-side location filter helper
  private filterByLocation(listings: Listing[], location: string): Listing[] {
    const searchTerm = location.toLowerCase();
    return listings.filter(l => 
      l.city.toLowerCase().includes(searchTerm) || 
      l.country.toLowerCase().includes(searchTerm)
    );
  }

  getSearchTitle(): string {
    if (this.searchParams.location) {
      return `Stays in ${this.searchParams.location}`;
    }
    return 'Search results';
  }

  getSearchParams(): string {
    const parts: string[] = [];
    
    if (this.searchParams.checkIn && this.searchParams.checkOut) {
      parts.push(`${this.searchParams.checkIn} - ${this.searchParams.checkOut}`);
    }
    
    if (this.searchParams.guests > 0) {
      parts.push(`${this.searchParams.guests} guest${this.searchParams.guests > 1 ? 's' : ''}`);
    }
    
    return parts.join(' · ') || 'Explore all stays';
  }

  toggleFavorite(event: Event, listing: Listing): void {
    event.stopPropagation();
    event.preventDefault();
    listing.isFavorite = !listing.isFavorite;
    // TODO: Call API to save favorite
  }

  clearFilters(): void {
    this.router.navigate(['/']);
  }
}