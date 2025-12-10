import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { initFlowbite } from 'flowbite';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoginModalComponent } from './core/auth/login-modal/login-modal.component';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';
import { NgxSpinnerComponent } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, LoginModalComponent, ChatWidgetComponent, NgxSpinnerComponent],
  template: `
    <app-login-modal></app-login-modal>
    <app-chat-widget *ngIf="showChatWidget"></app-chat-widget>
    <ngx-spinner bdColor="rgba(51,51,51,0.8)" size="medium" color="#fff" type="ball-scale-multiple">
        <p style="font-size: 20px; color: white">Loading...</p>
    </ngx-spinner>

    <app-navbar *ngIf="showNavbar"></app-navbar>

    <router-outlet></router-outlet>

    <app-footer *ngIf="showFooter"></app-footer>
  `,
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);

  showNavbar = true;
  showFooter = true;
  showChatWidget = true;

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
    const isAdmin = url.includes('/admin');

    this.showNavbar = !isHostingFlow && !isAdmin;
    this.showFooter = !isHostingFlow && !isAdmin;

    // Hide chat widget on admin pages
    this.showChatWidget = !isAdmin;
  }
}
