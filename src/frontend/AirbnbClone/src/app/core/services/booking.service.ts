import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, CreateBookingRequest } from '../models/booking.interface';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private apiUrl = `${environment.apiUrl}/bookings`;

    constructor(private http: HttpClient) { }

    createBooking(booking: CreateBookingRequest): Observable<Booking> {
        return this.http.post<Booking>(this.apiUrl, booking);
    }

    getGuestBookings(): Observable<Booking[]> {
        return this.http.get<Booking[]>(this.apiUrl);
    }

    getBookingById(id: number): Observable<Booking> {
        return this.http.get<Booking>(`${this.apiUrl}/${id}`);
    }

    cancelBooking(id: number, reason?: string): Observable<void> {
        let url = `${this.apiUrl}/${id}`;
        if (reason) {
            url += `?reason=${encodeURIComponent(reason)}`;
        }
        return this.http.delete<void>(url);
    }
}
