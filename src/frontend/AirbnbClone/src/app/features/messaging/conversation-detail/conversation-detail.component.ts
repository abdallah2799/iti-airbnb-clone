import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessagingService } from '../../../core/services/messaging.service';
import { ConversationDetail, Message, SendMessageRequest } from '../../../core/models/message';

@Component({
  selector: 'app-conversation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.css']
})
export class ConversationDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() conversationId!: number;
  @Output() conversationClosed = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  conversationDetail: ConversationDetail | null = null;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  isSending = false;
  otherUserName = '';
  otherUserAvatar = '';
  listingTitle = '';
  currentUserId: string | null = null;

  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;

  constructor(private messagingService: MessagingService) {}

  ngOnInit(): void {
    this.currentUserId = this.messagingService.getCurrentUserId();
    this.loadConversation();
  }

  loadConversation(): void {
    this.isLoading = true;
    this.messagingService.getConversationMessages(this.conversationId).subscribe({
      next: (conversation) => {
        if (conversation) {
          this.conversationDetail = conversation;
          this.messages = conversation.messages;
          
          // Determine other user based on current user ID
          if (this.currentUserId === conversation.guest.id) {
            this.otherUserName = conversation.host.name;
            this.otherUserAvatar = conversation.host.profilePictureUrl || '/assets/images/default-avatar.png';
          } else {
            this.otherUserName = conversation.guest.name;
            this.otherUserAvatar = conversation.guest.profilePictureUrl || '/assets/images/default-avatar.png';
          }
          
          this.listingTitle = conversation.listing.title;
          this.shouldScrollToBottom = true;
          
          // Mark messages as read
          this.markUnreadMessagesAsRead();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.isSending) return;

    this.isSending = true;
    const request: SendMessageRequest = {
      conversationId: this.conversationId,
      content: this.newMessage.trim()
    };

    this.messagingService.sendMessage(request).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.newMessage = '';
        this.isSending = false;
        this.shouldScrollToBottom = true;
        this.focusInput();
        
        // Refresh conversations list to update last message
        this.messagingService.getConversations().subscribe();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isSending = false;
      }
    });
  }

  isSentByCurrentUser(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  markUnreadMessagesAsRead(): void {
    const unreadMessages = this.messages
      .filter(m => !m.isRead && m.senderId !== this.currentUserId)
      .map(m => m.id);

    if (unreadMessages.length > 0) {
      this.messagingService.markAsRead(unreadMessages).subscribe({
        next: () => {
          // Update local messages
          this.messages.forEach(m => {
            if (unreadMessages.includes(m.id)) {
              m.isRead = true;
            }
          });
          // Refresh unread count
          this.messagingService.getUnreadCount().subscribe();
        },
        error: (error) => console.error('Error marking messages as read:', error)
      });
    }
  }

  goBack(): void {
    this.conversationClosed.emit();
  }

  handleImageError(event: any): void {
    event.target.src = '/assets/images/default-avatar.png';
  }

  private focusInput(): void {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 0);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}