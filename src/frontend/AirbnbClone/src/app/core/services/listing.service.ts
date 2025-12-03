import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { AmenityDto, ListingDetailsDto } from '../../features/host/models/listing-details.model';
import { Listing } from '../models/listing.interface';

export interface LocationOption {
  city: string;
  country: string;
  listingCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}listings`;

  getAllListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.baseUrl);
  }

  getPublishedListings(): Observable<Listing[]> {
    return this.getAllListings();
  }

  getListingById(id: number): Observable<ListingDetailsDto> {
    return this.http.get<ListingDetailsDto>(`${this.baseUrl}/${id}`);
  }

  searchByLocation(location: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/search`, {
      params: { location },
    });
  }

  searchByBounds(
    bounds: { north: number; south: number; east: number; west: number },
    guests: number = 0
  ): Observable<Listing[]> {
    let params = new HttpParams()
      .set('minLat', bounds.south.toString())
      .set('maxLat', bounds.north.toString())
      .set('minLng', bounds.west.toString())
      .set('maxLng', bounds.east.toString());

    if (guests > 0) {
      params = params.set('guests', guests.toString());
    }

    return this.http.get<Listing[]>(`${this.baseUrl}/map-search`, {
      params,
      headers: { 'X-Skip-Loader': 'true' }
    });
  }

  filterByDates(startDate: string, endDate: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/filter/dates`, {
      params: { startDate, endDate },
    });
  }

  filterByGuests(guests: number): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/filter/guests`, {
      params: { guests: guests.toString() },
    });
  }

  getHostListings(hostId: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/host/${hostId}`);
  }

  getAllAmenities(): Observable<AmenityDto[]> {
    return this.http.get<AmenityDto[]>(`${this.baseUrl}/amenities`);
  }

  getUniqueLocations(): Observable<LocationOption[]> {
    return this.getAllListings().pipe(
      map((listings) => {
        const locationMap = new Map<string, LocationOption>();

        listings.forEach((listing) => {
          const key = `${listing.city}-${listing.country}`;

          if (locationMap.has(key)) {
            const existing = locationMap.get(key)!;
            existing.listingCount++;
          } else {
            locationMap.set(key, {
              city: listing.city,
              country: listing.country,
              listingCount: 1,
            });
          }
        });

        return Array.from(locationMap.values()).sort((a, b) => b.listingCount - a.listingCount);
      })
    );
  }

  searchLocations(searchTerm: string): Observable<LocationOption[]> {
    return this.getUniqueLocations().pipe(
      map((locations) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return locations;

        return locations.filter(
          (loc) => loc.city.toLowerCase().includes(term) || loc.country.toLowerCase().includes(term)
        );
      })
    );
  }
}
