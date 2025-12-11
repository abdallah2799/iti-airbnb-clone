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
import { Listing } from '../../core/models/listing.interface';
import * as L from 'leaflet';

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
  map: L.Map | undefined;
  markers: L.Marker[] = [];

  // Prevent infinite loop
  private isUpdatingMarkers = false;

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
    // Initialize map AFTER the view is ready
    this.initMap();
  }

  performSearch(location: string) {
    this.searchService.searchByLocation(location).subscribe((data: any) => {
      this.listings = data;
      if (this.map) {
        this.updateMapMarkers(true); // Pass true to indicate this is from search
      }
    });
  }

  initMap() {
    if (!this.mapContainer) return;

    // Initialize Leaflet map
    this.map = L.map(this.mapContainer.nativeElement).setView([48.8566, 2.3522], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Listen for map move end (equivalent to Google Maps 'idle')
    this.map.on('moveend', () => {
      this.onMapIdle();
    });

    if (this.listings.length > 0) {
      this.updateMapMarkers(true);
    }
  }

  onMapIdle() {
    // Prevent API calls while we're updating markers
    if (this.isUpdatingMarkers || !this.map) {
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const boundData = {
      north: ne.lat,
      south: sw.lat,
      east: ne.lng,
      west: sw.lng,
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
    if (!this.map) return;

    // Set flag to prevent infinite loop
    this.isUpdatingMarkers = true;

    // 1. Clear old markers
    this.markers.forEach((m) => m.remove());
    this.markers = [];

    // 2. Create bounds to fit all markers
    const coordinates: L.LatLngExpression[] = [];
    let hasValidMarkers = false;

    this.listings.forEach((listing) => {
      const lat = listing.latitude || (listing as any).Latitude;
      const lng = listing.longitude || (listing as any).Longitude;

      if (lat && lng) {
        const position: L.LatLngExpression = [lat, lng];

        // Create custom price marker with DivIcon
        const priceIcon = L.divIcon({
          className: 'custom-price-marker',
          html: `
            <div style="
              background-color: white;
              color: #222222;
              border: 2px solid #222222;
              border-radius: 20px;
              padding: 4px 12px;
              font-size: 13px;
              font-weight: 600;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">
              $${listing.pricePerNight}
            </div>
          `,
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        });

        const marker = L.marker(position, { icon: priceIcon }).addTo(this.map!);

        this.markers.push(marker);
        coordinates.push(position);
        hasValidMarkers = true;
      }
    });

    // 3. Only fit bounds for initial search, not for drag events
    if (hasValidMarkers && shouldFitBounds && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      this.map.fitBounds(bounds, { padding: [50, 50] });

      // Prevent excessive zoom on single markers
      setTimeout(() => {
        const currentZoom = this.map!.getZoom();
        if (currentZoom > 15) {
          this.map!.setZoom(15);
        }
        // Reset flag after bounds change completes
        this.isUpdatingMarkers = false;
      }, 100);
    } else {
      // Reset flag immediately if not fitting bounds
      setTimeout(() => {
        this.isUpdatingMarkers = false;
      }, 100);
    }
  }
}
