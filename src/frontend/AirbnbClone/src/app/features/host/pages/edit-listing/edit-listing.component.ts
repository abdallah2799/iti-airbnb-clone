import { Component, inject, OnInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HostService } from '../../services/host.service';
import { UpdateListingDto, PropertyType, PrivacyType, Amenity } from '../../models/listing.model';
import { ToastrService } from 'ngx-toastr';
import {
  LucideAngularModule,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  MapPin,
  LocateFixed,
  Navigation,
} from 'lucide-angular';
import { environment } from '../../../../../environments/environment.development';

// Declare Google
declare var google: any;

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-listing.component.html',
  styles: [
    `
      .map-wrapper {
        height: 400px;
        width: 100%;
        border-radius: 0.75rem;
        overflow: hidden;
        margin-top: 1rem;
      }
    `,
  ],
})
export class EditListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hostService = inject(HostService);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone); // Needed for Google Maps

  readonly icons = { ChevronLeft, Save, Loader2, Check, MapPin, LocateFixed, Navigation };
  isLocating = false;

  // Map Elements
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('addressInput') addressInput!: ElementRef;

  map: any;
  marker: any;
  autocomplete: any;

  listingId: number = 0;
  isLoading = true;
  isSaving = false;

  availableAmenities: Amenity[] = [];

  formData: UpdateListingDto = {
    title: '',
    description: '',
    pricePerNight: 0,
    address: '',
    city: '',
    country: '',
    maxGuests: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    propertyType: PropertyType.House,
    privacyType: PrivacyType.EntirePlace,
    instantBooking: false,
    amenityIds: [],
    latitude: 0,
    longitude: 0,
  };

  // ... (Keep propertyTypes and privacyTypes arrays) ...
  propertyTypes = [
    { value: PropertyType.Apartment, label: 'Apartment' },
    { value: PropertyType.House, label: 'House' },
    { value: PropertyType.Villa, label: 'Villa' },
    { value: PropertyType.Cabin, label: 'Cabin' },
    { value: PropertyType.Room, label: 'Room' },
  ];

  privacyTypes = [
    { value: PrivacyType.EntirePlace, label: 'Entire place' },
    { value: PrivacyType.Room, label: 'Private room' },
    { value: PrivacyType.SharedRoom, label: 'Shared room' },
  ];

  ngOnInit() {
    this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.listingId) {
      this.loadData();
    }
  }

  loadData() {
    this.hostService.getAmenities().subscribe((amenities) => {
      this.availableAmenities = amenities;

      this.hostService.getListingById(this.listingId).subscribe({
        next: (data) => {
          this.formData = {
            title: data.title,
            description: data.description,
            pricePerNight: data.pricePerNight,
            address: data.address,
            city: data.city,
            country: data.country,
            maxGuests: data.maxGuests,
            numberOfBedrooms: data.numberOfBedrooms,
            numberOfBathrooms: data.numberOfBathrooms,
            propertyType: data.propertyType,
            privacyType: data.privacyType,
            instantBooking: data.instantBooking,
            amenityIds: data.amenities ? data.amenities.map((a) => a.id) : [],
            latitude: data.latitude, // Load existing coords
            longitude: data.longitude,
          };
          this.isLoading = false;

          // Initialize Map AFTER the view renders (because of *ngIf="!isLoading")
          setTimeout(() => {
            this.loadGoogleMaps();
          }, 100);
        },
        error: () => {
          this.toastr.error('Could not load listing');
          this.router.navigate(['/my-listings']);
        },
      });
    });
  }

  // --- GOOGLE MAPS LOGIC ---

  loadGoogleMaps() {
    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      this.initAutocomplete();
      return;
    }

    const script = document.createElement('script');
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
    if (!this.mapContainer) return;

    const defaultLoc = { lat: 37.7749, lng: -122.4194 };
    const hasLocation = this.formData.latitude && this.formData.longitude;

    const center = hasLocation
      ? { lat: this.formData.latitude!, lng: this.formData.longitude! }
      : defaultLoc;

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
      draggable: true,
      visible: !!hasLocation,
    });

    this.marker.addListener('dragend', () => {
      const position = this.marker.getPosition();
      this.formData.latitude = position.lat();
      this.formData.longitude = position.lng();
    });
  }

  initAutocomplete() {
    if (!this.addressInput) return;

    this.autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
      types: ['address'],
    });

    this.autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = this.autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) return;

        // Update Coords
        this.formData.latitude = place.geometry.location.lat();
        this.formData.longitude = place.geometry.location.lng();

        // Update Map
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(16);
        this.marker.setPosition(place.geometry.location);
        this.marker.setVisible(true);

        // Update Fields
        this.formData.address = place.formatted_address;
        this.extractLocationDetails(place.address_components);
      });
    });
  }

  extractLocationDetails(components: any[]) {
    this.formData.city = '';
    this.formData.country = '';

    for (const component of components) {
      const types = component.types;
      if (types.includes('locality')) {
        this.formData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1') && !this.formData.city) {
        this.formData.city = component.long_name;
      }
      if (types.includes('country')) {
        this.formData.country = component.long_name;
      }
    }
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Geolocation callbacks run outside Angular, so we use ngZone
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // 1. Update Local State
          this.formData.latitude = lat;
          this.formData.longitude = lng;

          // 2. Update Map Visuals
          const pos = { lat, lng };
          this.map.setCenter(pos);
          this.map.setZoom(17);
          this.marker.setPosition(pos);
          this.marker.setVisible(true);

          // 3. Reverse Geocode (Coords -> Address Text)
          this.reverseGeocode(pos);
        });
      },
      (error) => {
        console.error(error);
        alert('Unable to retrieve your location. Please allow location access.');
      }
    );
  }

  // Helper to turn coords into text
  reverseGeocode(latLng: any) {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: latLng }, (results: any, status: any) => {
      this.ngZone.run(() => {
        if (status === 'OK' && results[0]) {
          // Auto-fill the address text
          this.formData.address = results[0].formatted_address;

          // Reuse your existing extractor for City/Country
          this.extractLocationDetails(results[0].address_components);
        } else {
          console.error('Geocoder failed due to: ' + status);
        }
      });
    });
  }

  // ... (Keep toggleAmenity, hasAmenity, onSave) ...
  toggleAmenity(id: number) {
    /* ... same as before ... */
  }
  hasAmenity(id: number): boolean {
    return this.formData.amenityIds?.includes(id) ?? false;
  }

  onSave() {
    this.isSaving = true;
    this.hostService.updateListing(this.listingId, this.formData).subscribe({
      next: () => {
        this.toastr.success('Listing updated successfully');
        this.router.navigate(['/my-listings', this.listingId]);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update listing');
        this.isSaving = false;
      },
    });
  }
}
