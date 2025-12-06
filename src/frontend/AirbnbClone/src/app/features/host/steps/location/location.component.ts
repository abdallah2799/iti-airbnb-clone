import { Component, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Navigation, Search } from 'lucide-angular';
import * as L from 'leaflet'; // Import Leaflet

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
        z-index: 1;
      }
    `,
  ],
})
export class LocationComponent implements AfterViewInit {
  listingService = inject(ListingCreationService);
  router = inject(Router);

  readonly icons = { Navigation, Search };

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Data bindings
  address = this.listingService.listingData().address || '';
  city = this.listingService.listingData().city || '';
  country = this.listingService.listingData().country || '';
  latitude = this.listingService.listingData().latitude || 0;
  longitude = this.listingService.listingData().longitude || 0;

  private map!: L.Map;
  private marker!: L.Marker;

  // Search results for the custom dropdown
  searchResults: any[] = [];

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    // Default to London if no coords (51.505, -0.09)
    const lat = this.latitude || 51.505;
    const lng = this.longitude || -0.09;
    const zoom = this.latitude ? 15 : 2;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], zoom);

    // Add the OpenStreetMap Tiles (The visual map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Add Marker
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    // Update coords when marker is dragged
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.updateLocationData(position.lat, position.lng);
      this.reverseGeocode(position.lat, position.lng);
    });

    // Update marker when map is clicked
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.updateLocationData(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  // --- FREE GEOCODING (NOMINATIM) ---

  // 1. Search for an address (Autocomplete replacement)
  searchAddress() {
    if (!this.address || this.address.length < 3) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.address}`)
      .then((res) => res.json())
      .then((data) => {
        this.searchResults = data; // Show these in a dropdown list in HTML
      });
  }

  // 2. Select an address from the list
  selectAddress(result: any) {
    this.address = result.display_name;
    this.searchResults = []; // Hide dropdown

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    this.map.setView([lat, lon], 16);
    this.marker.setLatLng([lat, lon]);
    this.updateLocationData(lat, lon);

    // Extract City/Country from the address object if available
    // (Nominatim returns a complex address object if you add &addressdetails=1)
    this.reverseGeocode(lat, lon);
  }

  // 3. Get City/Country from Coordinates
  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        this.address = data.display_name;
        this.city = data.address.city || data.address.town || data.address.village || '';
        this.country = data.address.country || '';

        // Update Backpack
        this.saveToBackpack();
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
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      this.map.setView([latitude, longitude], 16);
      this.marker.setLatLng([latitude, longitude]);
      this.updateLocationData(latitude, longitude);
      this.reverseGeocode(latitude, longitude);
    });
  }

  isValid() {
    return !!this.city && !!this.country;
  }

  onNext() {
    if (this.isValid()) this.router.navigate(['/hosting/floor-plan']);
  }

  onSaveExit() {
    this.saveToBackpack();
    this.listingService.saveAndExit();
  }
}
