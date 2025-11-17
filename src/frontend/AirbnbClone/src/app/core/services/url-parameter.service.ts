// url-parameter.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlParameterService {
  
  extractTokenFromUrl(): string {
    console.log('🔧 Extracting token from URL...');
    
    // Method 1: URLSearchParams (most reliable)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || '';
      
      console.log('📋 URLSearchParams result:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      
      if (token) {
        return this.decodeParameter(token);
      }
    } catch (error) {
      console.error('❌ URLSearchParams failed:', error);
    }

    // Method 2: Manual parsing
    const manualToken = this.parseUrlManually();
    if (manualToken) {
      return manualToken;
    }

    console.log('❌ No token found in URL');
    return '';
  }

  private parseUrlManually(): string {
    const search = window.location.search;
    if (!search) return '';

    // Remove the leading '?' and split by '&'
    const params = search.substring(1).split('&');
    
    for (const param of params) {
      const [key, value] = param.split('=');
      if (key === 'token' && value) {
        console.log('🔧 Manual parsing found token:', value.substring(0, 20) + '...');
        return this.decodeParameter(value);
      }
    }
    
    return '';
  }

  private decodeParameter(param: string): string {
    if (!param) return '';

    try {
      // Replace + with space first (URL encoding quirk)
      let decoded = param.replace(/\+/g, ' ');
      // Then decode
      decoded = decodeURIComponent(decoded);
      return decoded.trim();
    } catch (e) {
      console.error('❌ Error decoding parameter:', e);
      return param;
    }
  }
}