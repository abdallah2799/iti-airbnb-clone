import { Injectable, signal } from '@angular/core';
import { CreateListingDto, PropertyType, PrivacyType } from '../models/listing.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs'; // <-- Don't forget this import

@Injectable({
  providedIn: 'root',
})
export class ListingCreationService {
  // Initialize with empty/default values
  private initialData: CreateListingDto = {
    title: '',
    description: '',
    pricePerNight: 0,
    address: '',
    city: '',
    country: '',
    maxGuests: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    propertyType: null,
    privacyType: null,
    instantBooking: false,
  };

  // The Signal that holds the current state of the wizard
  listingData = signal<CreateListingDto>(this.initialData);

  constructor(private http: HttpClient) {}

  // Updates specific fields in the listing
  updateListing(changes: Partial<CreateListingDto>) {
    this.listingData.update((current) => ({ ...current, ...changes }));
    console.log('Updated Listing:', this.listingData());
  }

  // --- ADD THIS METHOD ---
  createListing(): Observable<any> {
    // Sends the current signal data to your backend API
    // Assumes your endpoint is POST /api/HostListings
    return this.http.post(`${environment.baseUrl}HostListings`, this.listingData());
  }

  // --- ADD THIS METHOD ---
  reset() {
    // Resets the signal back to initial state for the next time
    this.listingData.set(this.initialData);
  }
}
