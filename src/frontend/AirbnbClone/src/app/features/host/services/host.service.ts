import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ListingBookingDto, ListingDetailsDto, PhotoDto } from '../models/listing-details.model';
import { UpdateListingDto, Amenity } from '../models/listing.model';

@Injectable({
  providedIn: 'root',
})
export class HostService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  // GET /api/HostListings
  getMyListings(): Observable<ListingDetailsDto[]> {
    return this.http.get<ListingDetailsDto[]>(`${this.baseUrl}HostListings`);
  }

  // GET /api/HostListings/{id}
  getListingById(id: number): Observable<ListingDetailsDto> {
    return this.http.get<ListingDetailsDto>(`${this.baseUrl}HostListings/${id}`);
  }

  // POST /api/HostListings/{listingId}/photos
  uploadPhoto(listingId: number, file: File): Observable<PhotoDto[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PhotoDto[]>(`${this.baseUrl}HostListings/${listingId}/photos`, formData);
  }

  // DELETE /api/HostListings/{listingId}/photos/{photoId}
  deletePhoto(listingId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}HostListings/${listingId}/photos/${photoId}`);
  }

  // GET /api/HostListings/{listingId}/photos/{photoId}
  getPhotoById(listingId: number, photoId: number): Observable<PhotoDto> {
    return this.http.get<PhotoDto>(`${this.baseUrl}HostListings/${listingId}/photos/${photoId}`);
  }
  // DELETE /api/HostListings/{id}
  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}HostListings/${id}`);
  }

  // PUT /api/HostListings/{id}
  updateListing(id: number, data: UpdateListingDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}HostListings/${id}`, data);
  }

  // PUT /api/HostListings/{listingId}/photos/{photoId}/set-cover
  setCoverPhoto(listingId: number, photoId: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}HostListings/${listingId}/photos/${photoId}/set-cover`,
      {} // Empty body
    );
  }
  // GET /api/hostbookings/{id}
  getBookingById(id: number) {
    return this.http.get<any>(`${this.baseUrl}hostbookings/${id}`);
  }

  // POST /api/hostbookings/{id}/approve
  approveBooking(id: number) {
    return this.http.post(`${this.baseUrl}hostbookings/${id}/approve`, {});
  }

  // POST /api/hostbookings/{id}/reject
  rejectBooking(id: number) {
    return this.http.post(`${this.baseUrl}hostbookings/${id}/reject`, {});
  }

  // GET /api/HostBookings
  getHostReservations() {
    return this.http.get<ListingBookingDto[]>(`${this.baseUrl}hostBookings`);
  }

  // GET /api/Amenities
  getAmenities(): Observable<Amenity[]> {
    return this.http.get<Amenity[]>(`${this.baseUrl}Amenities`);
  }
}
