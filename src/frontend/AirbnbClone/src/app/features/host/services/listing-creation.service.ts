import { inject, Injectable, signal } from '@angular/core';
import { CreateListingDto, PropertyType, PrivacyType } from '../models/listing.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { Observable, switchMap, of, from, concatMap, toArray, map } from 'rxjs';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class ListingCreationService {
  private router = inject(Router);
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

  saveAndExit() {
    const currentData = this.listingData();

    if (currentData.id) {
      // Case A: We already have an ID (Editing an existing draft)
      // Call PUT
      this.http
        .put(`${environment.baseUrl}HostListings/${currentData.id}`, currentData)
        .subscribe(() => {
          this.reset();
          this.router.navigate(['/my-listings']);
        });
    } else {
      // Case B: No ID yet (Creating a new draft)
      // Call POST
      // Note: Backend will set Status = Draft automatically
      this.http.post<any>(`${environment.baseUrl}HostListings`, currentData).subscribe(() => {
        this.reset();
        this.router.navigate(['/my-listings']);
      });
    }
  }

  // Method to Load a Draft (For when they click "Finish Listing" on dashboard)
  loadDraft(listing: any) {
    this.listingData.set({
      id: listing.id,
      title: listing.title || '',
      description: listing.description || '',
      pricePerNight: listing.pricePerNight || 0,
      address: listing.address || '',
      city: listing.city || '',
      country: listing.country || '',
      maxGuests: listing.maxGuests || 1,
      numberOfBedrooms: listing.numberOfBedrooms || 1,
      numberOfBathrooms: listing.numberOfBathrooms || 1,
      instantBooking: listing.instantBooking || false,
      latitude: listing.latitude,
      longitude: listing.longitude,
      propertyType: listing.propertyType,
      privacyType: listing.privacyType,

      cleaningFee: listing.cleaningFee,
      minimumNights: listing.minimumNights,
      photoFiles: [],
    });
  }
}
