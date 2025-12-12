import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  QueryList,
  ViewChildren,
  signal,
  inject,
  DestroyRef,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagingService } from 'src/app/core/services/messaging.service';
import { SignalRService } from 'src/app/core/services/signalr.service';
import { ConversationDetail, Message, SendMessageRequest } from 'src/app/core/models/message';
import { finalize, filter } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';

// Trigger rebuild

@Component({
  selector: 'app-conversation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.css']
})
export class ConversationDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() conversationId!: number;
  @Output() conversationClosed = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('message') private messageElements!: QueryList<ElementRef>;

  private messagingService = inject(MessagingService);
  private signalRService = inject(SignalRService);
  private destroyRef = inject(DestroyRef);

  // Signals for reactive state
  conversationDetail = signal<ConversationDetail | null>(null);
  messages = signal<Message[]>([]);
  newMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  isSending = signal<boolean>(false);
  otherUserName = signal<string>('');
  otherUserAvatar = signal<string>('');
  listingTitle = signal<string>('');
  currentUserId = signal<string | null>(null);

  constructor() {
    // Effect to scroll when messages change
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }

  ngOnInit(): void {
    this.currentUserId.set(this.messagingService.getCurrentUserId());
    this.loadConversation();
    this.setupRealtimeUpdates();
    
    // Wait for SignalR to connect before joining conversation
    if (this.signalRService.isConnected()) {
      this.signalRService.joinConversation(this.conversationId);
    } else {
      // Wait for connection to be established, skip initial null/undefined values
      this.signalRService.connectionState$.pipe(
        filter(state => state === signalR.HubConnectionState.Connected),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        this.signalRService.joinConversation(this.conversationId);
      });
    }
  }

  ngAfterViewInit(): void {
    this.messageElements.changes.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.scrollToBottom();
    });
  }

  setupRealtimeUpdates(): void {
    // Listen for new messages via SignalR
    this.signalRService.messageReceived$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event && Number(event.conversationId) === Number(this.conversationId)) {
        // Add the new message to the list
        const currentMessages = this.messages();
        const updatedMessages = [...currentMessages, event.message];
        this.messages.set(updatedMessages);
        
        // Mark as read if we're viewing this conversation
        if (event.message.senderId !== this.currentUserId()) {
          setTimeout(() => {
            this.markUnreadMessagesAsRead();
          }, 500);
        }
      }
    });

    // Listen for message read events
    this.signalRService.messageRead$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event && event.conversationId === this.conversationId) {
        // Update read status of messages
        const updatedMessages = this.messages().map(msg => {
          if (event.messageIds.includes(msg.id)) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
        this.messages.set(updatedMessages);
      }
    });
  }

  loadConversation(): void {
    this.isLoading.set(true);
    this.messages.set([]);
    
    this.messagingService.getConversationMessages(this.conversationId).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (conversation) => {
        if (conversation) {
          this.conversationDetail.set(conversation);
          this.messages.set(conversation.messages);

          // Determine other user
          if (this.currentUserId() === conversation.guest.id) {
            this.otherUserName.set(conversation.host.name);
            this.otherUserAvatar.set(conversation.host.profilePictureUrl || '/assets/images/default-avatar.png');
          } else {
            this.otherUserName.set(conversation.guest.name);
            this.otherUserAvatar.set(conversation.guest.profilePictureUrl || '/assets/images/default-avatar.png');
          }

          this.listingTitle.set(conversation.listing?.title || 'Conversation');

          setTimeout(() => this.scrollToBottom(), 0);
          this.markUnreadMessagesAsRead();
        }
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
      }
    });
  }

  sendMessage(): void {
    const messageContent = this.newMessage().trim();
    if (!messageContent || this.isSending()) return;

    this.isSending.set(true);
    
    // Use SignalR for real-time message sending
    this.signalRService.sendMessage(this.conversationId, messageContent)
      .then(() => {
        // Message sent successfully via SignalR
        // The message will be added to local state via ReceiveMessage event
        this.newMessage.set('');
        this.isSending.set(false);
      })
      .catch((error) => {
        console.error('Error sending message via SignalR:', error);
        this.isSending.set(false);
        
        // Fallback to HTTP if SignalR fails
        const request: SendMessageRequest = {
          conversationId: this.conversationId,
          content: messageContent
        };

        this.messagingService.sendMessage(request).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (message) => {
            const currentMessages = this.messages();
            this.messages.set([...currentMessages, message]);
            this.newMessage.set('');
            this.isSending.set(false);
            this.messagingService.getConversations(true).subscribe();
          },
          error: (error) => {
            console.error('Error sending message via HTTP:', error);
            this.isSending.set(false);
          }
        });
      });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  isSentByCurrentUser(message: Message): boolean {
    return message.senderId === this.currentUserId();
  }

  updateNewMessage(value: string): void {
    this.newMessage.set(value);
  }

  markUnreadMessagesAsRead(): void {
    const unreadMessages = this.messages()
      .filter(m => !m.isRead && m.senderId !== this.currentUserId())
      .map(m => m.id);

    if (unreadMessages.length > 0) {
      this.messagingService.markAsRead(unreadMessages).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          // Update local messages read status
          const updatedMessages = this.messages().map(m => {
            if (unreadMessages.includes(m.id)) {
              return { ...m, isRead: true };
            }
            return m;
          });
          this.messages.set(updatedMessages);

          // Update conversation read status in sidebar
          this.messagingService.updateConversationReadStatus(this.conversationId);

          // Refresh global unread count
          this.messagingService.getUnreadCount(true).subscribe();
        },
        error: (error) => console.error('Error marking messages as read:', error)
      });
    }
  }

  goBack(): void {
    this.conversationClosed.emit();
  }

  handleImageError(event: any): void {
    event.target.style.display = 'none';
    this.otherUserAvatar.set('');
  }

  ngOnDestroy(): void {
    // Leave the conversation when component is destroyed
    this.signalRService.leaveConversation(this.conversationId);
    // Cleanup handled by takeUntilDestroyed
  }
}
