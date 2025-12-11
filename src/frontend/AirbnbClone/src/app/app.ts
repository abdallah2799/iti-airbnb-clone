import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-project');
  private router = inject(Router);

  showNavbar = signal(true);
  showFooter = signal(true);

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
    // Hide navbar/footer on hosting flow pages (except dashboard)
    const isHostingFlow = url.includes('/hosting/') && url !== '/hosting';
    this.showNavbar.set(!isHostingFlow);
    this.showFooter.set(!isHostingFlow);
  }
}
