// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  AuthResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleAuthRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../models/auth.interface';

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

  // --- 1. REGISTRATION ---
  // Updated: Now saves tokens immediately because backend returns them
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}Auth/register`, userData).pipe(
      tap((response) => {
        if (response.token && response.refreshToken) {
          this.setTokens(response.token, response.refreshToken);
        }
      })
    );
  }

  // --- 2. GOOGLE AUTH ---
  // Updated: Now saves tokens immediately
  registerWithGoogle(googleToken: string): Observable<AuthResponse> {
    const request: GoogleAuthRequest = { googleToken };
    return this.http.post<AuthResponse>(`${this.baseUrl}Auth/register/google`, request).pipe(
      tap((response) => {
        if (response.token && response.refreshToken) {
          this.setTokens(response.token, response.refreshToken);
        }
      })
    );
  }

  // --- 3. LOGIN ---
  // Updated: Now handles Refresh Token
  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}Auth/login`, loginData).pipe(
      tap((response) => {
        if (response.token && response.refreshToken) {
          this.setTokens(response.token, response.refreshToken);
        }
      })
    );
  }

  // --- 4. REFRESH TOKEN (NEW) ---
  // This is called by the Interceptor when 401 happens
  refreshToken(): Observable<any> {
    const expiredToken = this.getToken();
    const refreshToken = this.getRefreshToken();

    const payload = {
      token: expiredToken,
      refreshToken: refreshToken,
    };

    return this.http.post<any>(`${this.baseUrl}Auth/refresh-token`, payload).pipe(
      tap((response) => {
        // Backend returns new pair: { token: "...", refreshToken: "..." }
        this.setTokens(response.token, response.refreshToken);
      })
    );
  }

  // --- 5. BECOME HOST ---
  // Updated: Backend now returns NEW tokens with Host role
  becomeHost(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Auth/become-host`, {}).pipe(
      tap((response) => {
        if (response.token && response.refreshToken) {
          this.setTokens(response.token, response.refreshToken);
        }
      })
    );
  }

  private isHostingViewSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('view_mode') === 'host'
  );
  isHostingView$ = this.isHostingViewSubject.asObservable();

  get isHostingViewValue(): boolean {
    return this.isHostingViewSubject.value;
  }

  setHostingView(isHosting: boolean) {
    this.isHostingViewSubject.next(isHosting);
    localStorage.setItem('view_mode', isHosting ? 'host' : 'guest');
  }

  // Forgot password method
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}Auth/forgot-password`, request);
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}Auth/reset-password`, resetData);
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

  // Check token validity and refresh user data
  validateToken(): Observable<any> {
    return this.http.get(`${this.baseUrl}Auth/validate`).pipe(
      tap((response: any) => {
        if (response.user) {
          // Update stored user data
          localStorage.setItem('user_data', JSON.stringify(response.user));
        }
      })
    );
  }

  // Confirm email method
  confirmEmail(userId: string, token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}Auth/confirm-email`, { userId, token }).pipe(
      tap((response) => {
        if (response.token && response.refreshToken) {
          this.setTokens(response.token, response.refreshToken);
        }
      })
    );
  }

  // Resend confirmation email method
  resendConfirmationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}Auth/resend-confirmation-email`, { email });
  }

  // Helper to manually handle login success (e.g. from components)
  handleLoginSuccess(response: AuthResponse): void {
    if (response.token && response.refreshToken) {
      this.setTokens(response.token, response.refreshToken, response.user);
    }
  }

  // --- HELPER METHODS ---

  // Updated: Saves BOTH tokens OR user data
  private setTokens(accessToken: string, refreshToken: string, user?: any): void {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
    this.tokenSubject.next(accessToken);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // New Helper
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Updated: Clears BOTH tokens
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token'); // Clear refresh token
    localStorage.removeItem('user_email');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('user_data');
    this.tokenSubject.next(null);
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

  // Copied from getCurrentUser but extended for stored data
  getCurrentUserStored(): any {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return this.getCurrentUser();
  }

  hasPassword(): boolean {
    const user = this.getCurrentUserStored();
    return user?.hasPassword ?? true; // Default to true if unknown, but better to rely on data
  }

  hasRole(roleToCheck: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;

    // The role claim can be a string (if 1 role) or an array (if multiple)
    if (Array.isArray(user.role)) {
      return user.role.includes(roleToCheck);
    }
    return user.role === roleToCheck;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SuperAdmin');
  }
}
