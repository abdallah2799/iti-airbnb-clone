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

declare var google: any;

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FilterModalComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, AfterViewInit {
  private listingService = inject(ListingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngZone = inject(NgZone);

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
  map: any;
  markers: any[] = [];
  private isUpdatingMarkers = false;
  showMap = false; // Only show map for location searches
  private PriceMarker: any; // Class reference for custom overlay

  @ViewChild('mapContainer')
  set mapContainer(element: ElementRef | undefined) {
    console.log('MapContainer Setter called:', element);
    if (element) {
      this._mapContainer = element;
      this.loadGoogleMaps();
    }
  }

  private _mapContainer!: ElementRef;

  mapStyles = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#d9f2fa" }]
    }
  ];

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
  }

  ngAfterViewInit() {
    // Logic handled by ViewChild setter
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

  toggleFavorite(event: Event, listing: Listing): void {
    event.stopPropagation();
    event.preventDefault();
    listing.isFavorite = !listing.isFavorite;
    // TODO: Call API to save favorite
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
          'entire': ['House', 'Apartment', 'Villa'],
          'private': ['Private Room']
        };

        return filters.propertyTypes!.some(typeId => {
          const matchingTypes = typeMapping[typeId] || [];
          return matchingTypes.some(type =>
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

  // ============ MAP FUNCTIONALITY ============

  loadGoogleMaps() {
    console.log('loadGoogleMaps called');
    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps Script Loaded');
      this.initMap();
    };

    document.body.appendChild(script);
  }

  initMap() {
    console.log('initMap called. Container:', this._mapContainer);
    if (!this._mapContainer?.nativeElement) {
      console.error('Map container nativeElement missing in initMap');
      return;
    }

    console.log('Creating Google Map...');
    // Define Custom Marker Class
    this.PriceMarker = class extends google.maps.OverlayView {
      position: any;
      price: string;
      div?: HTMLElement;
      map: any;

      constructor(position: any, price: string, map: any) {
        super();
        this.position = position;
        this.price = price;
        this.map = map;
        // Fix: Use bracket notation or cast to any to avoid index signature error
        (this as any)['setMap'](map);
      }

      onAdd() {
        const div = document.createElement('div');
        div.className = 'price-marker';
        div.innerHTML = this.price;
        this.div = div;

        const panes = (this as any)['getPanes']();
        panes?.overlayMouseTarget.appendChild(div);

        // Add click listener
        div.addEventListener('click', (e: any) => {
          e.stopPropagation();
          // Trigger some active state or info window here
          console.log('Clicked marker:', this.price);
        });
      }

      draw() {
        const overlayProjection = (this as any)['getProjection']();
        const position = overlayProjection.fromLatLngToDivPixel(this.position);

        if (this.div && position) {
          this.div.style.left = position.x + 'px';
          this.div.style.top = position.y + 'px';
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = undefined;
        }
      }
    };

    this.map = new google.maps.Map(this._mapContainer.nativeElement, {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
      scrollwheel: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: this.mapStyles,
      clickableIcons: false, // Disable POI clicks
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
        this.allListings.set(data);
        this.applyFilters();
        this.currentPage.set(1);
        this.updateMapMarkers(false); // Don't fit bounds when dragging
      });
    });
  }

  updateMapMarkers(shouldFitBounds: boolean = true) {
    if (!this.map || !this.PriceMarker) return;

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
        const position = new google.maps.LatLng(lat, lng);

        // Use Custom Price Marker
        const marker = new this.PriceMarker(
          position,
          `$${listing.pricePerNight}`,
          this.map
        );

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
