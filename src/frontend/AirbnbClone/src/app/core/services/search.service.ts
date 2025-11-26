import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { Listing, PropertyType } from '../../core/models/listing.interface';
import { ListingDetailsDto } from '../../features/host/models/listing-details.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  listingData = signal<Listing>({
    id: 0,
    title: '',
    city: '',
    country: '',
    address: '',
    latitude: 0,
    longitude: 0,
    pricePerNight: 0,
    currency: '',
    propertyType: 0,
    maxGuests: 0,
    numberOfBedrooms: 0,
    numberOfBathrooms: 0,
    coverPhotoUrl: '',
    averageRating: 0,
    reviewCount: 0,
    hostName: '',
    isSuperHost: false,
    isFavorite: false,
  });

  // GET /api/Listings/search?location=Paris
  searchByLocation(location: string): Observable<Listing[]> {
    const params = new HttpParams().set('location', location);
    return this.http.get<Listing[]>(`${this.baseUrl}Listings/search`, { params });
  }

  // GET /api/Listings/map-search?minLat=...&maxLat=...
  searchByBounds(bounds: any): Observable<Listing[]> {
    let params = new HttpParams()
      .set('minLat', bounds.south)
      .set('maxLat', bounds.north)
      .set('minLng', bounds.west)
      .set('maxLng', bounds.east);

    return this.http.get<Listing[]>(`${this.baseUrl}Listings/map-search`, { params });
  }
}
