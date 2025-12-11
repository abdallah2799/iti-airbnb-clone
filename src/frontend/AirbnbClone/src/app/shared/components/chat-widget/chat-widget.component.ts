import { Component, inject, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { MarkdownComponent } from 'ngx-markdown';

interface ChatMessage {
  text: string;
  isUser: boolean; // true = user, false = bot
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownComponent],
  templateUrl: './chat-widget.component.html',
  styles: [`
    /* Custom scrollbar for the chat area */
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
  `]
})
export class ChatWidgetComponent implements AfterViewChecked {
  private aiService = inject(AiAssistantService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  isHostingFlow = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkHostingFlow(event.url);
    });

    // Initial check
    this.checkHostingFlow(this.router.url);
  }

  private checkHostingFlow(url: string) {
    // Check if url starts with /hosting/ but NOT just /hosting (dashboard)
    this.isHostingFlow = url.includes('/hosting/') && url !== '/hosting';
  }

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  userMessage = '';
  readonly MAX_CHARS = 1200;

  messages: ChatMessage[] = [
    { text: 'Hello! 👋 I can answer questions about this property. Ask me anything!', isUser: false, timestamp: new Date() }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  get remainingChars(): number {
    return this.MAX_CHARS - this.userMessage.length;
  }

  get wordCount(): number {
    return this.userMessage.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  sendMessage() {
    if (!this.userMessage.trim() || this.userMessage.length > this.MAX_CHARS) return;

    // 1. Add User Message immediately
    const question = this.userMessage;
    this.messages.push({ text: question, isUser: true, timestamp: new Date() });
    this.userMessage = '';
    this.isLoading = true;

    // 2. Call API
    this.aiService.askBot(question).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.typeMessage(res.answer);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.messages.push({ text: "I'm having trouble connecting right now.", isUser: false, timestamp: new Date() });
      }
    });
  }

  private typeMessage(fullText: string) {
    const message: ChatMessage = { text: '', isUser: false, timestamp: new Date() };
    this.messages.push(message);
    this.cdr.detectChanges();

    let i = 0;
    const intervalId = setInterval(() => {
      this.ngZone.run(() => {
        if (i < fullText.length) {
          message.text += fullText.charAt(i);
          i++;
          this.cdr.detectChanges();
          this.scrollToBottom();
        } else {
          clearInterval(intervalId);
        }
      });
    }, 20); // Adjust speed as needed (20ms per char)
  }

  // Auto-scroll to bottom when new messages arrive
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}