import { Component, OnInit, OnDestroy, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MessagingService } from 'src/app/core/services/messaging.service';
import { SignalRService } from 'src/app/core/services/signalr.service';
import { Conversation } from 'src/app/core/models/message';
import { ConversationDetailComponent } from '../conversation-detail/conversation-detail.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, ConversationDetailComponent, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  private messagingService = inject(MessagingService);
  private signalRService = inject(SignalRService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Signals for reactive state
  conversations = signal<Conversation[]>([]);
  selectedConversationId = signal<number | undefined>(undefined);
  unreadCount = signal<number>(0);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(false);
  currentUserId = signal<string | null>(null);
  failedAvatars = signal<Set<number>>(new Set());
  isSignalRConnected = signal<boolean>(false);

  // Computed filtered conversations
  filteredConversations = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allConversations = this.conversations();

    if (!term) {
      return allConversations;
    }

    return allConversations.filter(conv =>
      conv.hostName.toLowerCase().includes(term) ||
      conv.guestName.toLowerCase().includes(term) ||
      conv.listingTitle.toLowerCase().includes(term) ||
      conv.lastMessageContent?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    const userId = this.messagingService.getCurrentUserId();
    this.currentUserId.set(userId);

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Check for conversationId in query params
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['conversationId']) {
        this.selectedConversationId.set(Number(params['conversationId']));
      }
    });

    this.loadConversations();
    this.setupRealtimeUpdates();
  }

  setupRealtimeUpdates(): void {
    // Subscribe to conversations updates
    this.messagingService.conversations$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(conversations => {
      this.conversations.set(conversations);
    });

    // Subscribe to unread count updates
    this.messagingService.unreadCount$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(count => {
      this.unreadCount.set(count);
    });

    // Subscribe to SignalR connection state
    this.signalRService.connectionState$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.isSignalRConnected.set(this.signalRService.isConnected());
    });

    // Subscribe to real-time message received events
    this.signalRService.messageReceived$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event) {
        // Refresh conversations to show new message and update unread count
        this.messagingService.getConversations(true).subscribe();
      }
    });

    // Subscribe to real-time message read events
    this.signalRService.messageRead$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event) {
        // Refresh conversations to update unread counts and badges
        this.messagingService.getConversations(true).subscribe();
      }
    });

    // Subscribe to conversation updated events
    this.signalRService.conversationUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(conversationId => {
      if (conversationId) {
        // Refresh conversations list
        this.messagingService.getConversations(true).subscribe();
      }
    });
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.messagingService.getConversations().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversationId.set(conversation.id);
  }

  onConversationClosed(): void {
    this.selectedConversationId.set(undefined);
    this.loadConversations();
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  getOtherUserName(conversation: Conversation): string {
    return conversation.guestId === this.currentUserId()
      ? conversation.hostName
      : conversation.guestName;
  }

  getOtherUserAvatar(conversation: Conversation): string {
    const avatar = conversation.guestId === this.currentUserId()
      ? conversation.hostProfilePicture
      : conversation.guestProfilePicture;
    return avatar || '/assets/images/default-avatar.png';
  }

  getLastMessageTime(conversation: Conversation): string {
    if (!conversation.lastMessageTimestamp) return '';

    const now = new Date();
    const messageDate = new Date(conversation.lastMessageTimestamp);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  handleImageError(event: any): void {
    event.target.src = '/assets/images/default-avatar.png';
  }

  hasAvatar(conversation: Conversation): boolean {
    if (this.failedAvatars().has(conversation.id)) {
      return false;
    }

    const avatar = this.getOtherUserAvatar(conversation);
    return !!avatar && avatar.length > 0;
  }

  onAvatarError(event: any, conversation: Conversation): void {
    event.target.style.display = 'none';
    const updatedSet = new Set(this.failedAvatars());
    updatedSet.add(conversation.id);
    this.failedAvatars.set(updatedSet);
  }

  ngOnDestroy(): void {
    // Cleanup handled by takeUntilDestroyed
  }
}