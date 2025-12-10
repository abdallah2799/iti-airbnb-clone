import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ListingService } from 'src/app/core/services/listing.service';
import { Listing } from 'src/app/core/models/listing.interface';
import { SearchService } from 'src/app/core/services/search.service';
import { SearchBarComponent } from 'src/app/shared/components/search-bar/search-bar.component';
import { environment } from 'src/environments/environment.development';
import { FilterModalComponent } from 'src/app/shared/components/filter-modal/filter-modal.component';
import { FilterCriteria } from 'src/app/core/models/filter-criteria.interface';
import { ListingCardComponent } from 'src/app/shared/components/listing-card/listing-card.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FilterModalComponent, ListingCardComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, AfterViewInit {
  private listingService = inject(ListingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private searchService = inject(SearchService);

  // Use signals for reactive state
  allListings = signal<Listing[]>([]); // Original unfiltered data
  listings = signal<Listing[]>([]); // Filtered data
  isLoading = signal<boolean>(true);

  // Filter state
  isFilterModalOpen = signal(false);
  activeFilters = signal<FilterCriteria | null>(null);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 18;

  paginatedListings = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.listings().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalItems = computed(() => this.listings().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));

  // Search parameters
  searchParams = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
  };

  // Map related
  map: L.Map | null = null;
  markers: L.Marker[] = [];
  private isUpdatingMarkers = false;
  showMap = false; // Only show map for location searches

  @ViewChild('mapContainer')
  set mapContainer(element: ElementRef | undefined) {
    console.log('MapContainer Setter called:', element);
    if (element) {
      this._mapContainer = element;
      this.initMap();
    }
  }

  private _mapContainer!: ElementRef;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      console.log('QueryParams changed:', params);
      this.searchParams = {
        location: params['location'] || '',
        checkIn: params['checkIn'] || '',
        checkOut: params['checkOut'] || '',
        guests: Number(params['guests']) || 0,
      };

      // 1. Determine visibility
      this.showMap = !!this.searchParams.location && !this.searchParams.checkIn;
      console.log('ShowMap calculated:', this.showMap);

      // 2. Trigger Search
      this.performSearch();
    });

    // Listen for Filter Trigger from Navbar
    this.searchService.filterModalTrigger$.subscribe(() => {
      this.openFilters();
    });
  }

  ngAfterViewInit() {
    // Logic handled by ViewChild setter
  }

  performSearch(): void {
    // 1. Kill the zombie map before the HTML disappears
    if (this.map) {
      this.map.remove(); // Leaflet cleanup
      this.map = null; // TypeScript cleanup
      this.markers = []; // Clear markers array
    }

    // 2. Now it's safe to hide the HTML
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
    this.listingService
      .filterByDates(this.searchParams.checkIn, this.searchParams.checkOut)
      .subscribe({
        next: (results) => {
          let filtered = results;

          // Apply additional filters client-side
          if (this.searchParams.location) {
            filtered = this.filterByLocation(filtered, this.searchParams.location);
          }

          if (this.searchParams.guests > 0) {
            filtered = filtered.filter((l) => l.maxGuests >= this.searchParams.guests);
          }

          this.allListings.set(filtered);
          this.applyFilters();
          this.currentPage.set(1);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Search error:', err);
          this.isLoading.set(false);
        },
      });
  }

  searchByLocation(): void {
    this.listingService.searchByLocation(this.searchParams.location).subscribe({
      next: (results) => {
        let filtered = results;

        if (this.searchParams.guests > 0) {
          filtered = filtered.filter((l) => l.maxGuests >= this.searchParams.guests);
        }

        this.allListings.set(filtered);
        this.applyFilters();
        this.currentPage.set(1);
        this.isLoading.set(false);

        // Update map if it exists
        if (this.map && this.showMap) {
          this.updateMapMarkers(true);
        }
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      },
    });
  }

  searchByGuests(): void {
    this.listingService.filterByGuests(this.searchParams.guests).subscribe({
      next: (results) => {
        this.allListings.set(results);
        this.applyFilters();
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      },
    });
  }

  loadAllListings(): void {
    this.listingService.getAllListings().subscribe({
      next: (results) => {
        this.allListings.set(results);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading listings:', err);
        this.isLoading.set(false);
      },
    });
  }

  // Client-side location filter helper
  private filterByLocation(listings: Listing[], location: string): Listing[] {
    const searchTerm = location.toLowerCase();
    return listings.filter(
      (l) =>
        l.city.toLowerCase().includes(searchTerm) || l.country.toLowerCase().includes(searchTerm)
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

  clearFilters(): void {
    this.router.navigate(['/']);
  }

  // ============ FILTER MODAL ============

  openFilters(): void {
    this.isFilterModalOpen.set(true);
  }

  closeFilters(): void {
    this.isFilterModalOpen.set(false);
  }

  handleApplyFilters(criteria: FilterCriteria): void {
    this.activeFilters.set(criteria);
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.allListings();
    const filters = this.activeFilters();

    if (!filters) {
      this.listings.set(filtered);
      return;
    }

    // Price filter
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter((l) => l.pricePerNight >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter((l) => l.pricePerNight <= filters.priceMax!);
    }

    // Property type filter
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      filtered = filtered.filter((l) => {
        // Map frontend type IDs to backend property types
        const typeMapping: { [key: string]: string[] } = {
          entire: ['House', 'Apartment', 'Villa'],
          private: ['Private Room'],
        };

        return filters.propertyTypes!.some((typeId) => {
          const matchingTypes = typeMapping[typeId] || [];
          return matchingTypes.some((type) =>
            (l as any).propertyType?.toLowerCase().includes(type.toLowerCase())
          );
        });
      });
    }

    // Amenities filter - listing must have ALL selected amenities
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((l) => {
        const listingAmenities = (l as any).amenities || [];
        return filters.amenities!.every((amenity) => {
          // Case-insensitive check
          return listingAmenities.some((la: string) =>
            la.toLowerCase().includes(amenity.toLowerCase())
          );
        });
      });
    }

    this.listings.set(filtered);
    this.currentPage.set(1); // Reset to first page when filters change
  }

  // ============ PAGINATION ============

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.scrollToTop();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============ MAP FUNCTIONALITY (LEAFLET) ============

  initMap() {
    if (!this._mapContainer || this.map) return;

    console.log('Initializing Leaflet map');

    // Create map instance
    this.map = L.map(this._mapContainer.nativeElement).setView([48.8566, 2.3522], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Listen for map move end to trigger "Search as I move"
    this.map.on('moveend', () => {
      if (!this.isUpdatingMarkers) {
        this.onMapIdle();
      }
    });

    // Initial marker update if we have listings
    if (this.listings().length > 0) {
      this.updateMapMarkers(true);
    }
  }

  onMapIdle() {
    if (!this.map) return;

    const bounds = this.map.getBounds();
    const boundData = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    // Call searchByBounds in service
    this.searchService.searchByBounds(boundData).subscribe((data) => {
      this.listings.set(data);
      this.updateMapMarkers(false); // Don't fit bounds when search triggers update
    });
  }

  updateMapMarkers(shouldFitBounds: boolean = true) {
    if (!this.map) return;

    this.isUpdatingMarkers = true;

    // Clear old markers
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    const bounds = L.latLngBounds([]);
    let hasValidMarkers = false;

    this.listings().forEach((listing) => {
      const lat = listing.latitude || (listing as any).Latitude;
      const lng = listing.longitude || (listing as any).Longitude;

      if (lat && lng) {
        const position = L.latLng(lat, lng);

        // Create custom price marker using divIcon
        const priceIcon = L.divIcon({
          className: 'price-marker',
          html: `<div class="price-marker-content">$${listing.pricePerNight}</div>`,
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });

        const marker = L.marker(position, { icon: priceIcon }).addTo(this.map!);

        // Add click handler to navigate to listing
        marker.on('click', () => {
          this.ngZone.run(() => {
            this.router.navigate(['/listing', listing.id]);
          });
        });

        this.markers.push(marker);
        bounds.extend(position);
        hasValidMarkers = true;
      }
    });

    if (hasValidMarkers && shouldFitBounds) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    setTimeout(() => {
      this.isUpdatingMarkers = false;
    }, 100);
  }
}
