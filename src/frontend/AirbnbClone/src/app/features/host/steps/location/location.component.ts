import { Component, inject, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';
import { environment } from '../../../../../environments/environment.development';

// Tell TypeScript that 'google' exists globally
declare var google: any;

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './location.component.html',
  styles: [
    `
      .map-wrapper {
        height: 400px;
        width: 100%;
        border-radius: 1rem;
        overflow: hidden;
      }
    `,
  ],
})
export class LocationComponent implements AfterViewInit {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);
  private ngZone = inject(NgZone); // Required to update UI after Google responds

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('addressInput') addressInput!: ElementRef;

  // Data bindings
  address = this.listingService.listingData().address || '';
  city = this.listingService.listingData().city || '';
  country = this.listingService.listingData().country || '';
  latitude = this.listingService.listingData().latitude || 0;
  longitude = this.listingService.listingData().longitude || 0;

  map: any;
  marker: any;
  autocomplete: any;

  ngAfterViewInit() {
    this.loadGoogleMaps();
  }

  loadGoogleMaps() {
    // Check if script is already loaded to prevent duplicates
    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      this.initAutocomplete();
      return;
    }

    const script = document.createElement('script');
    // Use the key from environment.development.ts
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.initMap();
      this.initAutocomplete();
    };

    document.body.appendChild(script);
  }

  initMap() {
    // Default to San Francisco if no location set yet
    const defaultLoc = { lat: 37.7749, lng: -122.4194 };
    const hasLocation = this.latitude && this.longitude;

    const center = hasLocation ? { lat: this.latitude, lng: this.longitude } : defaultLoc;
    const zoom = hasLocation ? 15 : 2;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: center,
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    this.marker = new google.maps.Marker({
      map: this.map,
      position: center,
      draggable: true, // Allow user to adjust pin
      visible: !!hasLocation,
    });

    // Update coords if user drags the pin
    this.marker.addListener('dragend', () => {
      const position = this.marker.getPosition();
      this.latitude = position.lat();
      this.longitude = position.lng();
    });
  }

  initAutocomplete() {
    this.autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
      types: ['address'],
    });

    this.autocomplete.addListener('place_changed', () => {
      // Run inside Angular Zone to update the UI variables
      this.ngZone.run(() => {
        const place = this.autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          return;
        }

        // 1. Update Map
        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();

        this.map.setCenter(place.geometry.location);
        this.map.setZoom(16);
        this.marker.setPosition(place.geometry.location);
        this.marker.setVisible(true);

        // 2. Extract Address Details
        this.address = place.formatted_address;
        this.extractLocationDetails(place.address_components);
      });
    });
  }

  extractLocationDetails(components: any[]) {
    this.city = '';
    this.country = '';

    for (const component of components) {
      const types = component.types;
      if (types.includes('locality')) {
        this.city = component.long_name;
      } else if (types.includes('administrative_area_level_1') && !this.city) {
        this.city = component.long_name;
      }
      if (types.includes('country')) {
        this.country = component.long_name;
      }
    }
  }

  // Validation
  isValid(): boolean {
    return !!this.address && !!this.city && !!this.country;
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;

          const location = new google.maps.LatLng(this.latitude, this.longitude);

          // Update map center & marker
          this.map.setCenter(location);
          this.map.setZoom(16);
          this.marker.setPosition(location);
          this.marker.setVisible(true);

          // Reverse geocode
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              this.address = results[0].formatted_address;
              this.extractLocationDetails(results[0].address_components);
            }
          });
        });
      },
      () => {
        alert('Unable to retrieve your location.');
      }
    );
  }

  onNext() {
    if (this.isValid()) {
      this.listingService.updateListing({
        address: this.address,
        city: this.city,
        country: this.country,
        latitude: this.latitude,
        longitude: this.longitude,
      });

      this.router.navigate(['/hosting/floor-plan']);
    }
  }
}
