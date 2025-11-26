import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessagingService } from '../../../../core/services/messaging.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      *ngIf="isLoggedIn"
      class="relative p-3 rounded-full hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
      (click)="navigateToMessages()"
      [attr.aria-label]="'Messages' + (unreadCount > 0 ? ' (' + unreadCount + ' unread)' : '')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-700">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
      
      <span *ngIf="unreadCount > 0" 
            class="absolute -top-1 -right-1 bg-[#FF385C] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>
  `
})
export class MessageButtonComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private messagingService = inject(MessagingService);
  private authService = inject(AuthService);
  
  unreadCount = 0;
  isLoggedIn = false;
  private subscription = new Subscription();

  ngOnInit(): void {
    // Check if user is logged in
    this.subscription.add(
      this.authService.token$.subscribe(token => {
        this.isLoggedIn = !!token;
        if (this.isLoggedIn) {
          this.loadUnreadCount();
        }
      })
    );

    // Subscribe to unread count updates
    this.subscription.add(
      this.messagingService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  private loadUnreadCount(): void {
    this.messagingService.getUnreadCount().subscribe();
  }

  navigateToMessages(): void {
    this.router.navigate(['/messages']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}