import { Injectable, inject, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.service';
import { Message } from '../models/message';

export interface MessageReceivedEvent {
  conversationId: number;
  message: Message;
}

export interface MessageReadEvent {
  conversationId: number;
  messageIds: number[];
  readByUserId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  private hubConnection?: signalR.HubConnection;
  private connectionStateSubject = new BehaviorSubject<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );

  // Observables for real-time events
  private messageReceivedSubject = new BehaviorSubject<MessageReceivedEvent | null>(null);
  private messageReadSubject = new BehaviorSubject<MessageReadEvent | null>(null);
  private conversationUpdatedSubject = new BehaviorSubject<number | null>(null);

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public messageRead$ = this.messageReadSubject.asObservable();
  public conversationUpdated$ = this.conversationUpdatedSubject.asObservable();

  constructor() {
    // Auto-connect when authenticated
    this.authService.token$.subscribe(token => {
      if (token) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  public async connect(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('Cannot connect to SignalR: No authentication token');
      return;
    }

    // Remove /api/ from baseUrl for SignalR hub connection
    const hubUrl = environment.baseUrl.replace('/api/', '/').replace('/api', '/');
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}hubs/chat`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 30s repeatedly
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup event handlers
    this.setupEventHandlers();

    // Connection lifecycle handlers
    this.hubConnection.onreconnecting(() => {
      this.ngZone.run(() => {
        this.connectionStateSubject.next(signalR.HubConnectionState.Reconnecting);
      });
    });

    this.hubConnection.onreconnected(() => {
      this.ngZone.run(() => {
        this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      });
    });

    this.hubConnection.onclose(() => {
      this.ngZone.run(() => {
        this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
      });
    });

    // Start connection
    try {
      await this.hubConnection.start();
      this.ngZone.run(() => {
        this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      });
      console.log('SignalR Connected');
    } catch (err) {
      console.error('Error connecting to SignalR:', err);
      this.ngZone.run(() => {
        this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
      });
    }
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
        console.log('SignalR Disconnected');
      } catch (err) {
        console.error('Error disconnecting from SignalR:', err);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Handle incoming messages
    this.hubConnection.on('ReceiveMessage', (messageData: any) => {
      this.ngZone.run(() => {
        const message: Message = {
          id: messageData.id,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          senderProfilePicture: messageData.senderProfilePicture,
          content: messageData.content,
          timestamp: new Date(messageData.timestamp),
          isRead: messageData.isRead
        };
        this.messageReceivedSubject.next({ 
          conversationId: messageData.conversationId, 
          message 
        });
      });
    });

    // Handle new message notifications (for conversation list updates)
    this.hubConnection.on('NewMessageNotification', (data: any) => {
      this.ngZone.run(() => {
        this.conversationUpdatedSubject.next(data.conversationId);
      });
    });

    // Handle message read receipts
    this.hubConnection.on('MessageRead', (conversationId: number, messageIds: number[], readByUserId: string) => {
      this.ngZone.run(() => {
        this.messageReadSubject.next({ conversationId, messageIds, readByUserId });
      });
    });

    // Handle conversation updates
    this.hubConnection.on('ConversationUpdated', (conversationId: number) => {
      this.ngZone.run(() => {
        this.conversationUpdatedSubject.next(conversationId);
      });
    });
  }

  // Join a conversation to receive real-time messages
  public async joinConversation(conversationId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Cannot join conversation: SignalR not connected');
      return;
    }

    try {
      await this.hubConnection.invoke('JoinConversation', conversationId);
      console.log(`Joined conversation ${conversationId}`);
    } catch (err) {
      console.error('Error joining conversation:', err);
    }
  }

  // Leave a conversation
  public async leaveConversation(conversationId: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveConversation', conversationId);
      console.log(`Left conversation ${conversationId}`);
    } catch (err) {
      console.error('Error leaving conversation:', err);
    }
  }

  // Send a message via SignalR
  public async sendMessage(conversationId: number, message: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.hubConnection.invoke('SendMessage', conversationId, message);
    } catch (err) {
      console.error('Error sending message via SignalR:', err);
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  public getConnectionState(): signalR.HubConnectionState {
    return this.hubConnection?.state ?? signalR.HubConnectionState.Disconnected;
  }
}
