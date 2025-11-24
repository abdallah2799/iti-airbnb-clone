import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { AmenityDto, ListingDetailsDto } from '../../host/models/listing-details.model'; // Correct import
import { Listing } from '../../../core/models/listing.interface';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}listings`;

  getAllListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.baseUrl);
  }

  getListingById(id: number): Observable<ListingDetailsDto> {
    return this.http.get<ListingDetailsDto>(`${this.baseUrl}/${id}`);
  }

  searchByLocation(location: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/search`, {
      params: { location }
    });
  }

  filterByDates(startDate: string, endDate: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/filter/dates`, {
      params: { startDate, endDate }
    });
  }

  filterByGuests(guests: number): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/filter/guests`, {
      params: { guests: guests.toString() }
    });
  }

  getHostListings(hostId: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/host/${hostId}`);
  }

  // NEW: Get all amenities
  getAllAmenities(): Observable<AmenityDto[]> {
    return this.http.get<AmenityDto[]>(`${this.baseUrl}/amenities`);
  }
}