import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessagingService } from '../../../core/services/messaging.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-host-container bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h3 class="text-xl font-semibold mb-4 text-gray-900">Contact Host</h3>
      
      <form (ngSubmit)="sendMessage()" class="contact-form">
        <textarea
          [(ngModel)]="message"
          name="message"
          placeholder="Hello! I'm interested in your place. Could you tell me more about..."
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent resize-none"
          rows="4"
          required
          #messageTextarea
        ></textarea>
        
        <button 
          type="submit" 
          class="w-full mt-4 bg-[#FF385C] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#E31C5F] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          [disabled]="!message.trim() || isLoading"
        >
          {{ isLoading ? 'Sending...' : 'Send Message' }}
        </button>
      </form>
    </div>
  `
})
export class ContactHostComponent {
  @Input() hostId!: string;
  @Input() listingId!: number;
  @Input() listingTitle!: string;

  private messagingService = inject(MessagingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  message = '';
  isLoading = false;

  sendMessage(): void {
    if (!this.message.trim()) return;

    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      this.toastr.error('Please login to send a message', 'Authentication Required');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    const request = {
      hostId: this.hostId,
      listingId: this.listingId,
      initialMessage: this.message.trim()
    };

    this.messagingService.createOrGetConversation(request).subscribe({
      next: (conversation) => {
        this.isLoading = false;
        this.toastr.success('Message sent successfully!', 'Success');
        this.message = '';
        
        // Navigate to messages after a short delay
        setTimeout(() => {
          this.router.navigate(['/messages']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to send message. Please try again.', 'Error');
        console.error('Error sending message:', error);
      }
    });
  }
}