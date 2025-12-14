import { Component, inject, OnInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Required for Geocoding
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
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule], // HttpClient must be provided in app config
  templateUrl: './edit-listing.component.html',
  styles: [
    `
      .map-wrapper {
        height: 400px;
        width: 100%;
        border-radius: 0.75rem;
        overflow: hidden;
        margin-top: 1rem;
        z-index: 0; /* Important for Leaflet */
      }
    `,
  ],
})
export class EditListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hostService = inject(HostService);
  private toastr = inject(ToastrService);
  private http = inject(HttpClient); // Inject HTTP for OSM Geocoding
  private ngZone = inject(NgZone);

  readonly icons = { ChevronLeft, Save, Loader2, Check, MapPin, LocateFixed, Navigation };

  // Map Elements
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Leaflet instances
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  listingId: number = 0;
  isLoading = true;
  isSaving = false;
  isLocating = false; // For loading state of "Use Current Location"

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
            latitude: data.latitude,
            longitude: data.longitude,
          };
          this.isLoading = false;

          // Initialize Map
          setTimeout(() => {
            this.initMap();
          }, 100);
        },
        error: () => {
          this.toastr.error('Could not load listing');
          this.router.navigate(['/my-listings']);
        },
      });
    });
  }

  // --- LEAFLET MAP LOGIC ---

  initMap() {
    if (!this.mapContainer) return;

    const lat = this.formData.latitude || 48.8566;
    const lng = this.formData.longitude || 2.3522;
    const zoom = this.formData.latitude ? 15 : 4;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map!);

    // === FIX START: Define the icon manually using CDN links ===
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    // === FIX END ===

    // Pass the icon to the marker options
    this.marker = L.marker([lat, lng], {
      draggable: true,
      icon: defaultIcon, // <--- Apply the fix here
    }).addTo(this.map!);

    this.marker.on('dragend', () => {
      const position = this.marker!.getLatLng();
      this.ngZone.run(() => {
        this.formData.latitude = position.lat;
        this.formData.longitude = position.lng;
        this.reverseGeocode(position.lat, position.lng);
      });
    });
  }

  // --- GEOCODING (NOMINATIM API) ---

  /**
   * Called when user manually types an address and hits Enter/Blur.
   * Replaces Google Autocomplete.
   */
  onAddressSearch() {
    if (!this.formData.address) return;

    const query = encodeURIComponent(this.formData.address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          this.updateMapLocation(lat, lon);

          // Nominatim address comes in parts, we can try to parse city/country from display_name
          // or do a reverse lookup for better structure.
          this.parseNominatimAddress(result);
        } else {
          this.toastr.warning('Address not found');
        }
      },
      error: () => this.toastr.error('Error searching address'),
    });
  }

  reverseGeocode(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe((data) => {
      if (data && data.address) {
        this.formData.address = data.display_name; // Full address string

        // Extract City/Country safely
        const addr = data.address;
        this.formData.city = addr.city || addr.town || addr.village || addr.county || '';
        this.formData.country = addr.country || '';
      }
    });
  }

  parseNominatimAddress(result: any) {
    // Nominatim search results are less structured than reverse results.
    // We update lat/lng, but to get City/Country reliably,
    // it's often safer to immediately reverse geocode the result we just found.
    this.reverseGeocode(parseFloat(result.lat), parseFloat(result.lon));
  }

  // Helper to move map and marker
  updateMapLocation(lat: number, lng: number) {
    this.formData.latitude = lat;
    this.formData.longitude = lng;

    if (this.map && this.marker) {
      const newLatLng = new L.LatLng(lat, lng);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, 16);
    }
  }

  // --- CURRENT LOCATION ---

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.toastr.error('Geolocation is not supported by this browser.');
      return;
    }

    this.isLocating = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.updateMapLocation(lat, lng);
          this.reverseGeocode(lat, lng);
          this.isLocating = false;
        });
      },
      (error) => {
        console.error(error);
        this.toastr.error('Unable to retrieve location');
        this.isLocating = false;
      }
    );
  }

  toggleAmenity(id: number) {
    // Ensure the array exists (safety check)
    if (!this.formData.amenityIds) {
      this.formData.amenityIds = [];
    }

    const index = this.formData.amenityIds.indexOf(id);

    if (index > -1) {
      // If found, remove it (Uncheck)
      this.formData.amenityIds.splice(index, 1);
    } else {
      // If not found, add it (Check)
      this.formData.amenityIds.push(id);
    }
  }

  /**
   * Helper to check if a specific amenity is currently selected.
   * Used by the HTML [checked] property.
   */
  hasAmenity(id: number): boolean {
    return this.formData.amenityIds?.includes(id) ?? false;
  }

  onSave() {
    // 🛑 VALIDATION LOGIC

    // Fix: Use (value || '') to handle undefined/null safely
    if (!(this.formData.title || '').trim()) {
      this.toastr.error('Title is required.', 'Missing Information');
      return;
    }

    if (!(this.formData.description || '').trim()) {
      this.toastr.error('Description is required.', 'Missing Information');
      return;
    }

    // Check address fields
    const address = (this.formData.address || '').trim();
    const city = (this.formData.city || '').trim();
    const country = (this.formData.country || '').trim();

    if (!address || !city || !country) {
      this.toastr.error('Address, City, and Country are required.', 'Location Missing');
      return;
    }

    // Fix: Use (val ?? 0) to default to 0 if undefined
    if ((this.formData.pricePerNight ?? 0) <= 0) {
      this.toastr.error('Price must be greater than $0.', 'Invalid Price');
      return;
    }

    if ((this.formData.maxGuests ?? 0) < 1) {
      this.toastr.error('Max guests must be at least 1.', 'Invalid Input');
      return;
    }
    if (this.formData.latitude === 0 && this.formData.longitude === 0) {
      this.toastr.warning('Please confirm the location on the map.', 'Location Warning');
    }

    // ✅ PROCEED
    this.isSaving = true;
    this.hostService.updateListing(this.listingId, this.formData).subscribe({
      next: () => {
        this.toastr.success('Listing updated successfully');
        this.router.navigate(['/my-listings', this.listingId]);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err.error?.message || 'Failed to update listing');
        this.isSaving = false;
      },
    });
  }
}
