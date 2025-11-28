import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { environment } from '../../../environments/environment.development';
import { Listing } from '../../core/models/listing.interface';

declare var google: any;

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent implements OnInit, AfterViewInit {
  private searchService = inject(SearchService);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  // The list of results
  listings: Listing[] = [];

  // Map related
  map: any;
  markers: any[] = [];

  // Prevent infinite loop
  private isUpdatingMarkers = false;

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

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const location = params['location'];
      if (location) {
        this.performSearch(location);
      }
    });
  }

  ngAfterViewInit() {
    // Load map AFTER the view is ready
    this.loadGoogleMaps();
  }

  performSearch(location: string) {
    this.searchService.searchByLocation(location).subscribe((data: any) => {
      this.listings = data;
      if (this.map) {
        this.updateMapMarkers(true); // Pass true to indicate this is from search
      }
    });
  }

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
    if (!this.mapContainer) return;

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

    if (this.listings.length > 0) {
      this.updateMapMarkers(true);
    }
  }

  onMapIdle() {
    // Prevent API calls while we're updating markers
    if (this.isUpdatingMarkers) {
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

    // Fetch listings inside this box
    this.searchService.searchByBounds(boundData).subscribe((data: any) => {
      this.ngZone.run(() => {
        this.listings = data;
        this.updateMapMarkers(false); // Don't fit bounds when dragging
      });
    });
  }

  updateMapMarkers(shouldFitBounds: boolean = true) {
    // Set flag to prevent infinite loop
    this.isUpdatingMarkers = true;

    // 1. Clear old markers
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];

    // 2. Create a "Bounds" box to stretch around all pins
    const bounds = new google.maps.LatLngBounds();
    let hasValidMarkers = false;

    this.listings.forEach((listing) => {
      const lat = listing.latitude || (listing as any).Latitude;
      const lng = listing.longitude || (listing as any).Longitude;

      if (lat && lng) {
        const position = { lat, lng };

        // Create custom marker with modern styling
        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          label: {
            text: `${listing.pricePerNight}`,
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

    // 3. Only fit bounds for initial search, not for drag events
    if (hasValidMarkers && shouldFitBounds) {
      this.map.fitBounds(bounds);

      // Prevent excessive zoom on single markers
      const listener = google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        const currentZoom = this.map.getZoom();
        if (currentZoom > 15) {
          this.map.setZoom(15);
        }
        // Reset flag after bounds change completes
        setTimeout(() => {
          this.isUpdatingMarkers = false;
        }, 100);
      });
    } else {
      // Reset flag immediately if not fitting bounds
      setTimeout(() => {
        this.isUpdatingMarkers = false;
      }, 100);
    }
  }
}
