import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateCheckoutRequest {
    listingId: number;
    startDate: string;
    endDate: string;
    guests: number;
    currency?: string;
    successUrl?: string;
    cancelUrl?: string;
}

export interface CheckoutSessionResult {
    sessionId: string;
    sessionUrl: string;
    bookingId: number;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/payments`;

    createCheckoutSession(request: CreateCheckoutRequest): Observable<CheckoutSessionResult> {
        return this.http.post<CheckoutSessionResult>(`${this.apiUrl}/create-checkout-session`, request);
    }

    cancelPendingBooking(bookingId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel-pending-booking/${bookingId}`, {});
    }
}
