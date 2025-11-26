// services/user-profile.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface Profile {
  id: string;
  userName: string;
  email: string;
  bio: string | null;
  profilePictureUrl: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  governmentIdVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  hostResponseRate: number | null;
  hostResponseTimeMinutes: number | null;
  hostSince: string | null;
}

export interface UpdateProfileRequest {
  bio?: string | null;
  fullName?: string | null;
  email?: string;
  phoneNumber?: string | null;
}

export interface UserName {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}UserProfile`);
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}UserProfile`, profileData);
  }

  updateProfilePicture(file: File): Observable<{ profilePictureUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ profilePictureUrl: string }>(`${this.baseUrl}UserProfile/profile-picture`, formData);
  }

  getUserName(): Observable<UserName> {
    return this.http.get<UserName>(`${this.baseUrl}UserProfile/name`);
  }
}