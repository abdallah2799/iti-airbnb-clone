import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { SearchBarComponent } from "./shared/components/search-bar/search-bar.component";
import { LoginModalComponent } from "./core/auth/login-modal/login-modal.component";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, LoginModalComponent, FooterComponent, ChatWidgetComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
  // Using default change detection for consistency
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-project');
  private router = inject(Router);

  showNavbar = signal(true);
  showFooter = signal(true);
  showChatbot = true;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.url);
    });
  }

  ngOnInit(): void {
    initFlowbite();
  }

  private checkRoute(url: string) {
    // Hide navbar/footer on hosting flow pages (except dashboard) AND admin pages
    const isHostingFlow = url.includes('/hosting/') && url !== '/hosting';
    const isAdminPage = url.includes('/admin');

    this.showNavbar.set(!isHostingFlow && !isAdminPage);
    this.showFooter.set(!isHostingFlow && !isAdminPage);
    this.showChatbot = !isAdminPage; // Hide Chatbot on Admin pages
  }
}
