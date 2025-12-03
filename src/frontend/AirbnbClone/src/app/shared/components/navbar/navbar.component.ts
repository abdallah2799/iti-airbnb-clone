import { Component, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { LucideAngularModule } from 'lucide-angular';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SearchPillComponent } from '../search-pill/search-pill.component';
import { LoginModalComponent } from '../../../core/auth/login-modal/login-modal.component';
import { filter } from 'rxjs/operators';
import { MessageButtonComponent } from '../message-button/message-button/message-button.component';
import { ToastrService } from 'ngx-toastr';
import { SearchService } from '../../../core/services/search.service';

export type NavMode = 'minimal' | 'host' | 'guest';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    SearchBarComponent,
    SearchPillComponent,
    LoginModalComponent,

  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private searchService = inject(SearchService);

  // Signals for State Management
  navMode = signal<NavMode>('guest');
  isScrolled = signal<boolean>(false);
  isExpanded = signal<boolean>(true); // Default to expanded, but will be overridden by route

  // Computed State Helpers
  isMinimal = computed(() => this.navMode() === 'minimal');
  isHostView = computed(() => this.navMode() === 'host');
  isGuestView = computed(() => this.navMode() === 'guest');

  // Legacy properties (keeping for compatibility with existing template until refactored)
  activeNavItem = 'homes';
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isLoggedIn = false;
  currentUser: any = null;
  isHost = false;
  // isHostingView is now derived from navMode, but we sync it for now

  navItems = [
    {
      id: 'homes',
      label: 'Homes',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240',
      active: true,
      route: '/'
    },
    {
      id: 'experiences',
      label: 'Experiences',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/e47ab655-027b-4679-b2e6-df1c99a5c33d.png?im_w=240',
      badge: 'NEW',
      route: '/experiences'
    },
    {
      id: 'services',
      label: 'Services',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/3d67e9a9-520a-49ee-b439-7b3a75ea814d.png?im_w=240',
      badge: 'NEW',
      route: '/services'
    },
  ];

  constructor() {
    // Listen to Route Changes to set NavMode
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateNavMode(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    initFlowbite();
    this.checkAuthStatus();

    // Initialize NavMode based on current URL
    this.updateNavMode(this.router.url);

    // 1. Subscribe to Token changes
    this.authService.token$.subscribe(() => {
      this.checkAuthStatus();
    });

    // 2. Subscribe to View Mode changes
    this.authService.isHostingView$.subscribe((isHosting) => {
      // Sync service state with local signal if needed, 
      // but primarily we trust the URL and Service state combination
      if (isHosting && this.isHost) {
        this.navMode.set('host');
      } else if (!isHosting && this.navMode() === 'host') {
        this.navMode.set('guest');
      }
    });
  }

  updateNavMode(url: string) {
    if (
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password') ||
      url.includes('/auth/')
    ) {
      this.navMode.set('minimal');
      this.isExpanded.set(true);
    } else if (url.includes('/hosting') || url.includes('/calendar') || url.includes('/reservations') || this.authService.isHostingViewValue) {
      this.navMode.set('host');
      this.isExpanded.set(true);
    } else {
      this.navMode.set('guest');
      // If on search page, default to collapsed (false), otherwise expanded (true)
      // We check if the URL path starts with /search (ignoring query params)
      const isSearchPage = url.split('?')[0].includes('/search');
      this.isExpanded.set(!isSearchPage);
    }
  }

  checkAuthStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
      this.isHost = this.authService.hasRole('Host');
    } else {
      this.currentUser = null;
      this.isHost = false;
      this.authService.setHostingView(false);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as Element).closest('.relative')) {
      this.isDropdownOpen = false;
    }
  }

  onSearch(location: string) {
    this.router.navigate(['/searchMap'], { queryParams: { location } });
    // Collapse after search if we are on search page (which we will be)
    this.isExpanded.set(false);
  }

  onPillClick() {
    // Expand search
    this.isExpanded.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openFilters() {
    this.searchService.triggerFilterModal();
  }

  setActiveNavItem(itemId: string) {
    this.activeNavItem = itemId;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openLoginModal() {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/login') || currentUrl.includes('/register') || currentUrl.includes('/signup')) {
      this.isDropdownOpen = false;
      return;
    }
    this.authService.openLoginModal();
  }

  logout() {
    this.authService.logout();
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.checkAuthStatus();
    this.router.navigate(['/']);
  }

  navigateToProfile() {
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  navigateToChangePassword() {
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.router.navigate(['/change-password']);
  }

  onBecomeHost() {
    if (!this.isLoggedIn) {
      this.openLoginModal();
      return;
    }

    this.authService.becomeHost().subscribe({
      next: (response) => {
        if (response.token) {
          this.checkAuthStatus();
        }
        this.authService.setHostingView(true);
        this.router.navigate(['/hosting']);
        this.toastr.success('Success! You are now a Host.');
      },
      error: (err) => {
        if (err.error?.message === 'User is already a Host.') {
          this.checkAuthStatus();
          this.toggleHostingMode();
        } else {
          this.toastr.error(err.error?.message || 'Something went wrong');
        }
      },
    });
  }

  toggleHostingMode() {
    const isCurrentlyHosting = this.navMode() === 'host';
    const newState = !isCurrentlyHosting;

    this.authService.setHostingView(newState);

    if (newState) {
      this.router.navigate(['/my-listings']);
    } else {
      this.router.navigate(['/']);
    }
  }

  onLogoClick() {
    if (this.isHostView()) {
      this.router.navigate(['/reservations']);
    } else {
      this.authService.setHostingView(false); // Force Guest Mode
      this.navMode.set('guest'); // Update local signal immediately
      this.router.navigate(['/']);
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    // Force change detection if needed, though signal/property update should trigger it.
  }
}
