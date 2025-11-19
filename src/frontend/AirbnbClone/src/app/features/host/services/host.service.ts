import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ListingDetailsDto, PhotoDto } from '../models/listing-details.model';

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

  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}HostListings/${id}`);
  }

  deletePhoto(listingId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}HostListings/${listingId}/photos/${photoId}`);
  }

  // Using the logic we learned: FormData for file uploads
  addPhoto(listingId: number, file: File): Observable<PhotoDto[]> {
    const formData = new FormData();
    formData.append('file', file);
    // Your backend returns the UPDATED list of photos, which is great!
    return this.http.post<PhotoDto[]>(`${this.baseUrl}HostListings/${listingId}/photos`, formData);
  }
}
