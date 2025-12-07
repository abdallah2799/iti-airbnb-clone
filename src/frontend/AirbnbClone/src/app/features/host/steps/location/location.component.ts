import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Better than fetch
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Navigation, Search, Loader2, MapPin } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './location.component.html',
  styles: [
    `
      .map-wrapper {
        height: 400px;
        width: 100%;
        border-radius: 1rem;
        overflow: hidden;
        z-index: 0; /* Keeps it behind dropdowns */
      }
    `,
  ],
})
export class LocationComponent implements OnInit, AfterViewInit {
  listingService = inject(ListingCreationService);
  router = inject(Router);
  http = inject(HttpClient);
  ngZone = inject(NgZone);

  readonly icons = { Navigation, Search, Loader2, MapPin };

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Data bindings
  address = this.listingService.listingData().address || '';
  city = this.listingService.listingData().city || '';
  country = this.listingService.listingData().country || '';
  latitude = this.listingService.listingData().latitude || 0;
  longitude = this.listingService.listingData().longitude || 0;

  private map!: L.Map;
  private marker!: L.Marker;

  // Search Logic
  searchResults: any[] = [];
  isSearching = false;
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Setup the search pipeline (Debounce = wait 300ms after typing)
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 3) return of([]);
          this.isSearching = true;
          // Add addressdetails=1 to get city/country easily
          return this.http
            .get<any[]>(
              `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`
            )
            .pipe(
              catchError(() => of([])) // Prevent crash on error
            );
        })
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.isSearching = false;
      });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  // --- MAP LOGIC ---

  initMap() {
    // Default to London if no coords (51.505, -0.09)
    const lat = this.latitude || 51.505;
    const lng = this.longitude || -0.09;
    const zoom = this.latitude ? 15 : 4;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // === MARKER FIX (Same as before) ===
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    this.marker = L.marker([lat, lng], { draggable: true, icon: defaultIcon }).addTo(this.map);

    // Drag Event
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.ngZone.run(() => {
        this.updateLocationData(position.lat, position.lng);
        this.reverseGeocode(position.lat, position.lng);
      });
    });

    // Click Event
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.ngZone.run(() => {
        this.updateLocationData(e.latlng.lat, e.latlng.lng);
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    });
  }

  // --- SEARCH LOGIC (IMPROVED) ---

  // Triggered by (input) event in HTML
  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }

  selectAddress(result: any) {
    this.address = result.display_name;
    this.searchResults = []; // Clear dropdown

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Update Map
    this.map.setView([lat, lon], 16);
    this.marker.setLatLng([lat, lon]);

    // Update Data
    this.updateLocationData(lat, lon);

    // Parse City/Country from the detailed result directly!
    // Nominatim sends this in 'address' object because we added &addressdetails=1
    if (result.address) {
      this.city = result.address.city || result.address.town || result.address.village || '';
      this.country = result.address.country || '';
      this.saveToBackpack();
    } else {
      // Fallback if details missing
      this.reverseGeocode(lat, lon);
    }
  }

  // --- GEOCODING HELPERS ---

  reverseGeocode(lat: number, lng: number) {
    this.http
      .get<any>(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      .subscribe((data) => {
        if (data && data.address) {
          this.address = data.display_name;
          this.city = data.address.city || data.address.town || data.address.village || '';
          this.country = data.address.country || '';
          this.saveToBackpack();
        }
      });
  }

  updateLocationData(lat: number, lng: number) {
    this.latitude = lat;
    this.longitude = lng;
    this.saveToBackpack();
  }

  saveToBackpack() {
    this.listingService.updateListing({
      address: this.address,
      city: this.city,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
    });
  }

  useCurrentLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      this.ngZone.run(() => {
        this.map.setView([latitude, longitude], 16);
        this.marker.setLatLng([latitude, longitude]);
        this.updateLocationData(latitude, longitude);
        this.reverseGeocode(latitude, longitude);
      });
    });
  }

  isValid() {
    return !!this.city && !!this.country;
  }

  onNext() {
    if (this.isValid()) this.router.navigate(['/hosting/price']);
  }

  onSaveExit() {
    this.saveToBackpack();
    this.listingService.saveAndExit();
  }
}
