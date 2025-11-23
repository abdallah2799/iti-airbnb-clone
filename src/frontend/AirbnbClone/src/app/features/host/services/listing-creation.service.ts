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
    id: undefined, // Important: Starts undefined
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

  private uploadPhotos(listingId: number, files: File[]): Observable<any> {
    if (!files || files.length === 0) return of(true);

    return from(files).pipe(
      concatMap((file) => {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${environment.baseUrl}HostListings/${listingId}/photos`, formData);
      }),
      toArray()
    );
  }

  createListingAndUpload(): Observable<any> {
    const currentData = this.listingData();
    const { photoFiles, ...listingPayload } = currentData;
    let request$: Observable<any>;

    // A. Decide: Create (POST) or Update (PUT)?
    if (currentData.id) {
      // We have an ID -> UPDATE existing
      request$ = this.http
        .put(`${environment.baseUrl}HostListings/${currentData.id}`, listingPayload)
        .pipe(map(() => ({ listingId: currentData.id })));
    } else {
      // No ID -> CREATE new
      request$ = this.http.post<any>(`${environment.baseUrl}HostListings`, listingPayload);
    }

    return request$.pipe(
      switchMap((response) => {
        const id = response.listingId;

        // B. Upload Photos (if any new ones)
        return this.uploadPhotos(id, photoFiles || []).pipe(
          // C. CALL PUBLISH ENDPOINT (Fixes Status)
          switchMap(() => {
            return this.http.post(`${environment.baseUrl}HostListings/${id}/publish`, {});
          }),
          map(() => ({ listingId: id }))
        );
      })
    );
  }

  saveAndExit() {
    // (Your existing saveAndExit logic goes here - make sure it also checks for .id like above!)
    // Copy the "Decide: Create or Update" logic from createListingAndUpload
    const currentData = this.listingData();
    const { photoFiles, ...listingPayload } = currentData;
    let request$: Observable<any>;

    if (currentData.id) {
      request$ = this.http
        .put(`${environment.baseUrl}HostListings/${currentData.id}`, listingPayload)
        .pipe(map(() => ({ listingId: currentData.id })));
    } else {
      request$ = this.http.post<any>(`${environment.baseUrl}HostListings`, listingPayload);
    }

    request$
      .pipe(switchMap((res) => this.uploadPhotos(res.listingId, photoFiles || [])))
      .subscribe(() => {
        this.reset();
        this.router.navigate(['/my-listings']);
      });
  }

  reset() {
    this.listingData.set({ ...this.initialData, photoFiles: [] });
  }

  // Load existing data into the backpack
  loadDraft(listing: any) {
    this.listingData.set({
      id: listing.id, // <--- CRITICAL: Saves the ID so we update instead of create
      title: listing.title || '',
      description: listing.description || '',
      pricePerNight: listing.pricePerNight || 0,
      address: listing.address || '',
      city: listing.city || '',
      country: listing.country || '',
      maxGuests: listing.maxGuests || 1,
      numberOfBedrooms: listing.numberOfBedrooms || 1,
      numberOfBathrooms: listing.numberOfBathrooms || 1,
      propertyType: listing.propertyType,
      privacyType: listing.privacyType,
      instantBooking: listing.instantBooking, // <--- Fixes Instant Book UI
      latitude: listing.latitude || 0,
      longitude: listing.longitude || 0,
      photoFiles: [], // Reset local files
    });
  }
}
