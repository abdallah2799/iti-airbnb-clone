import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
import { AmenityDto, ListingDetailsDto } from '../../host/models/listing-details.model'; 
import { Listing } from '../../../core/models/listing.interface';


export interface LocationOption {
  city: string;
  country: string;
  listingCount: number;
}
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

  //  Get all amenities
  getAllAmenities(): Observable<AmenityDto[]> {
    return this.http.get<AmenityDto[]>(`${this.baseUrl}/amenities`);
  }

  //  Get unique locations from all listings
  getUniqueLocations(): Observable<LocationOption[]> {
    return this.getAllListings().pipe(
      map(listings => {
        // Group by city and country
        const locationMap = new Map<string, LocationOption>();

        listings.forEach(listing => {
          const key = `${listing.city}-${listing.country}`;
          
          if (locationMap.has(key)) {
            const existing = locationMap.get(key)!;
            existing.listingCount++;
          } else {
            locationMap.set(key, {
              city: listing.city,
              country: listing.country,
              listingCount: 1
            });
          }
        });

        // Convert to array and sort by listing count (most popular first)
        return Array.from(locationMap.values())
          .sort((a, b) => b.listingCount - a.listingCount);
      })
    );
  }

  //  Search locations (for autocomplete)
  searchLocations(searchTerm: string): Observable<LocationOption[]> {
    return this.getUniqueLocations().pipe(
      map(locations => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return locations;

        return locations.filter(loc => 
          loc.city.toLowerCase().includes(term) || 
          loc.country.toLowerCase().includes(term)
        );
      })
    );
  }
}