import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, tap, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.service';
import { 
  Message, 
  Conversation, 
  ConversationDetail, 
  CreateConversationRequest, 
  SendMessageRequest,
  MarkAsReadRequest,
  UnreadCountResponse
} from '../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.baseUrl}conversations`;
  
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Only start polling if user is authenticated
    this.authService.token$.subscribe(token => {
      if (token) {
        this.startPolling();
      }
    });
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.apiUrl).pipe(
      tap(conversations => {
        this.conversationsSubject.next(conversations);
        this.updateUnreadCount(conversations);
      })
    );
  }

  createOrGetConversation(request: CreateConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(this.apiUrl, request);
  }

  getConversationMessages(conversationId: number): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${this.apiUrl}/${conversationId}/messages`);
  }

  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/${request.conversationId}/messages`, 
      request
    );
  }

  markAsRead(messageIds: number[]): Observable<any> {
    const request: MarkAsReadRequest = { messageIds };
    return this.http.put(`${this.apiUrl}/messages/read`, request);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      map(response => response.unreadCount),
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  // Helper method to get current user ID
  getCurrentUserId(): string | null {
    const user = this.authService.getCurrentUser();
    if (!user) return null;

    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Get user ID from JWT claims
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
             || payload.sub 
             || payload.userId;
    } catch {
      return null;
    }
  }

  private startPolling(): void {
    interval(10000).pipe(
      startWith(0),
      switchMap(() => this.getConversations())
    ).subscribe();

    // Also poll unread count
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    ).subscribe();
  }

  private updateUnreadCount(conversations: Conversation[]): void {
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    this.unreadCountSubject.next(totalUnread);
  }
}