import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    AdminDashboardDto,
    AdminUserDto,
    AdminListingDto,
    AdminBookingDto,
    AdminReviewDto,
    PagedResult,
    ListingStatus,
    BookingStatus
} from '../models/admin.interfaces';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = `${environment.apiUrl}/admin`;

    private unverifiedCountSubject = new BehaviorSubject<number>(0);
    public unverifiedCount$ = this.unverifiedCountSubject.asObservable();

    constructor(private http: HttpClient) { }

    updateUnverifiedCount(count: number) {
        this.unverifiedCountSubject.next(count);
    }

    // ============= DASHBOARD =============
    getDashboardData(): Observable<AdminDashboardDto> {
        return this.http.get<AdminDashboardDto>(`${this.apiUrl}/dashboard`)
            .pipe(
                tap(data => this.updateUnverifiedCount(data.unverifiedListingsCount)),
                catchError(this.handleError)
            );
    }

    // ============= USERS =============
    getUsers(page: number = 1, pageSize: number = 10): Observable<PagedResult<AdminUserDto>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PagedResult<AdminUserDto>>(`${this.apiUrl}/users`, { params })
            .pipe(catchError(this.handleError));
    }

    getUser(id: string): Observable<AdminUserDto> {
        return this.http.get<AdminUserDto>(`${this.apiUrl}/users/${id}`)
            .pipe(catchError(this.handleError));
    }

    suspendUser(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/users/${id}/suspend`, {})
            .pipe(catchError(this.handleError));
    }

    unSuspendUser(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/users/${id}/unsuspend`, {})
            .pipe(catchError(this.handleError));
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`)
            .pipe(catchError(this.handleError));
    }

    // ============= LISTINGS =============
    getListings(page: number = 1, pageSize: number = 10, status?: string): Observable<PagedResult<AdminListingDto>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<PagedResult<AdminListingDto>>(`${this.apiUrl}/listings`, { params })
            .pipe(catchError(this.handleError));
    }

    getListing(id: number): Observable<AdminListingDto> {
        return this.http.get<AdminListingDto>(`${this.apiUrl}/listings/${id}`)
            .pipe(catchError(this.handleError));
    }

    updateListingStatus(id: number, status: ListingStatus): Observable<any> {
        return this.http.patch(`${this.apiUrl}/listings/${id}/status`, { status })
            .pipe(catchError(this.handleError));
    }

    deleteListing(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/listings/${id}`)
            .pipe(catchError(this.handleError));
    }

    // ============= BOOKINGS =============
    getBookings(page: number = 1, pageSize: number = 10): Observable<PagedResult<AdminBookingDto>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PagedResult<AdminBookingDto>>(`${this.apiUrl}/bookings`, { params })
            .pipe(catchError(this.handleError));
    }

    getBooking(id: number): Observable<AdminBookingDto> {
        return this.http.get<AdminBookingDto>(`${this.apiUrl}/bookings/${id}`)
            .pipe(catchError(this.handleError));
    }

    updateBookingStatus(id: number, status: BookingStatus): Observable<any> {
        return this.http.patch(`${this.apiUrl}/bookings/${id}/status`, { status })
            .pipe(catchError(this.handleError));
    }

    deleteBooking(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/bookings/${id}`)
            .pipe(catchError(this.handleError));
    }

    // ============= REVIEWS =============
    getReviews(page: number = 1, pageSize: number = 10): Observable<PagedResult<AdminReviewDto>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PagedResult<AdminReviewDto>>(`${this.apiUrl}/reviews`, { params })
            .pipe(catchError(this.handleError));
    }

    deleteReview(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/reviews/${id}`)
            .pipe(catchError(this.handleError));
    }

    suspendReviewAuthor(id: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/reviews/${id}/suspend-author`, {})
            .pipe(catchError(this.handleError));
    }

    // Helper for error handling
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            if (error.status === 401) {
                errorMessage = 'Unauthorized: Please login again.';
            } else if (error.status === 403) {
                errorMessage = 'Forbidden: You do not have permission to perform this action.';
            } else if (error.status === 400) {
                errorMessage = error.error?.message || 'Bad Request';
            } else if (error.status === 404) {
                errorMessage = 'Resource not found.';
            } else {
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
        }
        return throwError(() => new Error(errorMessage));
    }
}
