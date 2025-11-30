import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessagingService } from 'src/app/core/services/messaging.service';
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
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversationId?: number;
  unreadCount = 0;
  searchTerm = '';
  isLoading = false;
  currentUserId: string | null = null;

  private subscriptions = new Subscription();
  private failedAvatars = new Set<number>();

  constructor(
    private messagingService: MessagingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.messagingService.getCurrentUserId();

    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadConversations();

    this.subscriptions.add(
      this.messagingService.conversations$.subscribe(conversations => {
        this.conversations = conversations;
        this.filterConversations();
      })
    );

    this.subscriptions.add(
      this.messagingService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  loadConversations(): void {
    this.isLoading = true;
    this.messagingService.getConversations().subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversationId = conversation.id;
  }

  onConversationClosed(): void {
    this.selectedConversationId = undefined;
    this.loadConversations();
  }

  getOtherUserName(conversation: Conversation): string {
    return conversation.guestId === this.currentUserId
      ? conversation.hostName
      : conversation.guestName;
  }

  getOtherUserAvatar(conversation: Conversation): string {
    const avatar = conversation.guestId === this.currentUserId
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

  filterConversations(): void {
    if (!this.searchTerm) {
      this.filteredConversations = this.conversations;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredConversations = this.conversations.filter(conv =>
      conv.hostName.toLowerCase().includes(term) ||
      conv.guestName.toLowerCase().includes(term) ||
      conv.listingTitle.toLowerCase().includes(term) ||
      conv.lastMessageContent?.toLowerCase().includes(term)
    );
  }

  handleImageError(event: any): void {
    event.target.src = '/assets/images/default-avatar.png';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  hasAvatar(conversation: Conversation): boolean {
    if (this.failedAvatars.has(conversation.id)) {
      return false;
    }

    const avatar = this.getOtherUserAvatar(conversation);
    return !!avatar && avatar.length > 0;
  }

  onAvatarError(event: any, conversation: Conversation): void {
    event.target.style.display = 'none';
    this.failedAvatars.add(conversation.id);
  }
}