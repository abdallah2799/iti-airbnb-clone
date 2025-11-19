// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse, ChangePasswordRequest, ChangePasswordResponse, ForgotPasswordRequest, ForgotPasswordResponse, GoogleAuthRequest, LoginRequest, LoginResponse, RegisterRequest, ResetPasswordRequest, ResetPasswordResponse } from '../models/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
   private http = inject(HttpClient);
  
  private isLoginModalOpen = new BehaviorSubject<boolean>(false);
  isLoginModalOpen$ = this.isLoginModalOpen.asObservable();

  private baseUrl = environment.baseUrl;

  // Add token subject for reactive token changes
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  token$ = this.tokenSubject.asObservable();

  openLoginModal() {
    this.isLoginModalOpen.next(true);
  }

  closeLoginModal() {
    this.isLoginModalOpen.next(false);
  }

  // Email registration
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}Auth/register`, userData);
  }

  // Google authentication
  registerWithGoogle(googleToken: string): Observable<AuthResponse> {
    const request: GoogleAuthRequest = { googleToken };
    return this.http.post<AuthResponse>(`${this.baseUrl}Auth/register/google`, request);
  }

  // Login method with automatic token storage
  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}Auth/login`, loginData)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
        })
      );
  }

  // Forgot password method
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}Auth/forgot-password`, request);
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.baseUrl}Auth/reset-password`, 
      resetData
    );
  }

  // Change password method for authenticated users
  changePassword(changePasswordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(
      `${this.baseUrl}Auth/change-password`, 
      changePasswordData
    );
  }

  // Validate token method
  validateResetToken(token: string, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}Auth/validate-reset-token`, { token, email });
  }

  // Improved token management
  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('rememberMe');
    this.tokenSubject.next(null);
  }

  becomeHost(): Observable<any> {
    return this.http.post(`${this.baseUrl}Auth/become-host`, {});
  }

  updateToken(newToken: string) {
    localStorage.setItem('auth_token', newToken);
    this.tokenSubject.next(newToken);
  }

  getCurrentUser(): { email: string; fullName: string; role: string | string[] } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Look for the standard .NET Identity claim name
      const roleClaim =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;

      return {
        email: payload.email,
        fullName: payload.fullName,
        role: roleClaim,
      };
    } catch {
      return null;
    }
  }

  hasRole(roleToCheck: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;

    if (Array.isArray(user.role)) {
      return user.role.includes(roleToCheck);
    }
    return user.role === roleToCheck;
  }
}
