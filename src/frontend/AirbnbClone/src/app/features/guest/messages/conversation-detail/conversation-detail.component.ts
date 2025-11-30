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
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessagingService } from 'src/app/core/services/messaging.service';
import { ConversationDetail, Message, SendMessageRequest } from 'src/app/core/models/message';
import { finalize } from 'rxjs/operators';

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

  // Use @ViewChild to get a reference to the messages container
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  // Use @ViewChildren to watch for changes in the message elements themselves
  @ViewChildren('message') private messageElements!: QueryList<ElementRef>;

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

  constructor(private messagingService: MessagingService) { }

  ngOnInit(): void {
    this.currentUserId = this.messagingService.getCurrentUserId();
    this.loadConversation();
  }

  // Use ngAfterViewInit to subscribe to changes in the message list
  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.messageElements.changes.subscribe(() => {
        // This code now runs ONLY when a message is added or removed from the DOM
        this.scrollToBottom();
      })
    );
  }

  loadConversation(): void {
    this.isLoading = true;
    this.messages = []; // Clear previous messages
    this.messagingService.getConversationMessages(this.conversationId).pipe(finalize(() => {
      this.isLoading = false; // This will run on success OR error
    })).subscribe({
      next: (conversation) => {
        if (conversation) {
          this.conversationDetail = conversation;
          // Set messages and trigger the initial scroll
          this.messages = conversation.messages;

          // Determine other user...
          if (this.currentUserId === conversation.guest.id) {
            this.otherUserName = conversation.host.name;
            this.otherUserAvatar = conversation.host.profilePictureUrl || '/assets/images/default-avatar.png';
          } else {
            this.otherUserName = conversation.guest.name;
            this.otherUserAvatar = conversation.guest.profilePictureUrl || '/assets/images/default-avatar.png';
          }

          this.listingTitle = conversation.listing.title;

          // The `messageElements.changes` subscription will handle the scroll automatically.
          // We can also force a scroll after the view is stable for the initial load.
          setTimeout(() => this.scrollToBottom(), 0);

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
        // Pushing the new message will trigger the `messageElements.changes` subscription,
        // which will then call scrollToBottom().
        this.messages.push(message);
        this.newMessage = '';
        this.isSending = false;

        // Refresh conversations list to update last message
        this.messagingService.getConversations().subscribe();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isSending = false;
      }
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

  // ... rest of your component code (isSentByCurrentUser, markUnreadMessagesAsRead, etc.) ...

  isSentByCurrentUser(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  markUnreadMessagesAsRead(): void {
    // Debug: Check if IDs match
    // console.log('Current User:', this.currentUserId);

    const unreadMessages = this.messages
      .filter(m => !m.isRead && m.senderId !== this.currentUserId)
      .map(m => m.id);

    if (unreadMessages.length > 0) {
      this.messagingService.markAsRead(unreadMessages).subscribe({
        next: () => {
          // 1. Update local messages in the chat view
          this.messages.forEach(m => {
            if (unreadMessages.includes(m.id)) {
              m.isRead = true;
            }
          });

          // 2. VITAL FIX: Tell the service to update the sidebar/list immediately
          this.messagingService.updateConversationReadStatus(this.conversationId);

          // 3. Refresh global unread count from server to be 100% sure
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
    // When image fails to load, hide the img and clear the avatar URL
    event.target.style.display = 'none';
    this.otherUserAvatar = ''; // This will show the placeholder
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
