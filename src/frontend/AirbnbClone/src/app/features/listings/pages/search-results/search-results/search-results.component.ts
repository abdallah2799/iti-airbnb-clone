import {
  Component,
  OnInit,
  inject,
  signal,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ListingService } from '../../../services/listing.service';
import { Listing } from '../../../../../core/models/listing.interface';
import { SearchService } from '../../../../../core/services/search.service';
import { SearchBarComponent } from '../../../../../shared/components/search-bar/search-bar.component';
import { environment } from '../../../../../../environments/environment.development';

declare var google: any;

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, AfterViewInit {
  private listingService = inject(ListingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // Use signals for reactive state
  listings = signal<Listing[]>([]);
  isLoading = signal<boolean>(true);

  // Search parameters
  searchParams = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
  };

  // Map related
  map: any;
  markers: any[] = [];
  private isUpdatingMarkers = false;
  showMap = false; // Only show map for location searches

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  mapStyles = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ lightness: 57 }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#a7a7a7' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#D9F2FA' }],
    },
  ];

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.searchParams = {
        location: params['location'] || '',
        checkIn: params['checkIn'] || '',
        checkOut: params['checkOut'] || '',
        guests: Number(params['guests']) || 0,
      };

      // 1. Determine visibility
      this.showMap = !!this.searchParams.location && !this.searchParams.checkIn;

      // 2. Trigger Search
      this.performSearch();

      // 3. FIX: Trigger Map Load HERE if needed
      // We use setTimeout to allow Angular to render the *ngIf="showMap" div first
      if (this.showMap) {
        setTimeout(() => {
          this.loadGoogleMaps();
        }, 100);
      }
    });
  }

  ngAfterViewInit() {
    // The logic is now handled dynamically in ngOnInit whenever params change.
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

          this.listings.set(filtered);
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

        this.listings.set(filtered);
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
        this.listings.set(results);
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
        this.listings.set(results);
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

  toggleFavorite(event: Event, listing: Listing): void {
    event.stopPropagation();
    event.preventDefault();
    listing.isFavorite = !listing.isFavorite;
    // TODO: Call API to save favorite
  }

  clearFilters(): void {
    this.router.navigate(['/']);
  }

  // ============ MAP FUNCTIONALITY ============

  loadGoogleMaps() {
    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.initMap();
    };

    document.body.appendChild(script);
  }

  initMap() {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      zoomControl: true,
      scrollwheel: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // LISTEN FOR DRAG EVENTS
    this.map.addListener('idle', () => {
      this.onMapIdle();
    });

    // If we already have listings, update markers
    if (this.listings().length > 0) {
      this.updateMapMarkers(true);
    }
  }

  onMapIdle() {
    // Only fetch by bounds if we're in location search mode
    if (!this.showMap || this.isUpdatingMarkers) {
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const boundData = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };

    const guestCount = this.searchParams.guests || 0;

    // Fetch listings inside this box
    this.listingService.searchByBounds(boundData, guestCount).subscribe((data: any) => {
      this.ngZone.run(() => {
        this.listings.set(data);
        this.updateMapMarkers(false); // Don't fit bounds when dragging
      });
    });
  }

  updateMapMarkers(shouldFitBounds: boolean = true) {
    if (!this.map) return;

    this.isUpdatingMarkers = true;

    // Clear old markers
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidMarkers = false;

    this.listings().forEach((listing) => {
      const lat = listing.latitude || (listing as any).Latitude;
      const lng = listing.longitude || (listing as any).Longitude;

      if (lat && lng) {
        const position = { lat, lng };

        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          label: {
            text: `$${listing.pricePerNight}`,
            color: '#222222',
            fontSize: '13px',
            fontWeight: '600',
          },
          icon: {
            path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
            fillColor: 'red',
            fillOpacity: 1,
            strokeColor: '#222222',
            strokeWeight: 2,
            scale: 2,
            labelOrigin: new google.maps.Point(0, -30),
          },
          animation: google.maps.Animation.DROP,
        });

        this.markers.push(marker);
        bounds.extend(position);
        hasValidMarkers = true;
      }
    });

    if (hasValidMarkers && shouldFitBounds) {
      this.map.fitBounds(bounds);

      const listener = google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        const currentZoom = this.map.getZoom();
        if (currentZoom > 15) {
          this.map.setZoom(15);
        }
        setTimeout(() => {
          this.isUpdatingMarkers = false;
        }, 100);
      });
    } else {
      setTimeout(() => {
        this.isUpdatingMarkers = false;
      }, 100);
    }
  }
}
