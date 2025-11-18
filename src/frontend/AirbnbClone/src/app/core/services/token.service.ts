// token.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly RESET_TOKEN_KEY = 'reset_token';

  saveResetToken(token: string): void {
    localStorage.setItem(this.RESET_TOKEN_KEY, token);
  }

  getResetToken(): string {
    return localStorage.getItem(this.RESET_TOKEN_KEY) || '';
  }

  clearResetToken(): void {
    localStorage.removeItem(this.RESET_TOKEN_KEY);
  }

  hasValidResetToken(): boolean {
    return !!this.getResetToken();
  }
}