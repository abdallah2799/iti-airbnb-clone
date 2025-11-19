import { Injectable, signal } from '@angular/core';
import { CreateListingDto, PropertyType, PrivacyType } from '../models/listing.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { Observable, switchMap, of, from, concatMap, toArray, map } from 'rxjs';
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
    photoFiles: [],
    latitude: 0,
    longitude: 0,
  };

  // The Signal that holds the current state of the wizard
  listingData = signal<CreateListingDto>(this.initialData);

  constructor(private http: HttpClient) {}

  // Updates specific fields in the listing
  updateListing(changes: Partial<CreateListingDto>) {
    this.listingData.update((current) => ({ ...current, ...changes }));
    console.log('Updated Listing:', this.listingData());
  }

  createListingAndUpload(): Observable<any> {
    const currentData = this.listingData();
    const { photoFiles, ...listingPayload } = currentData;

    // 1. Create the Listing
    return this.http.post<any>(`${environment.baseUrl}HostListings`, listingPayload).pipe(
      switchMap((response) => {
        const newListingId = response.listingId;

        // If no photos, just return success
        if (!photoFiles || photoFiles.length === 0) {
          return of(response);
        }
        // We convert the array of files into a stream of items using 'from'
        return from(photoFiles).pipe(
          // 'concatMap' waits for the previous upload to finish before starting the next
          concatMap((file) => {
            const formData = new FormData();
            formData.append('file', file); // Match the C# parameter name 'file'

            return this.http.post(
              `${environment.baseUrl}HostListings/${newListingId}/photos`,
              formData
            );
          }),
          // Collect all responses back into an array so the subscribe completes once
          toArray(),
          // Return the original create response (or the photos response)
          map(() => response)
        );
      })
    );
  }

  reset() {
    this.listingData.set({
      ...this.initialData,
      photoFiles: [],
    });
  }
}
