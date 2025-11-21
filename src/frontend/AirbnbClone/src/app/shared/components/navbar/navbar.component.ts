import { Component, HostListener, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { LucideAngularModule } from 'lucide-angular';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { LoginModalComponent } from '../../../core/auth/login-modal/login-modal.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    NavItemComponent,
    SearchBarComponent,
    LoginModalComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  isScrolled = false;
  activeNavItem = 'homes';
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isLoggedIn = false;
  currentUser: any = null;
  isHost = false;
  isHostingView = false;

  navItems = [
    {
      id: 'homes',
      label: 'Homes',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240',
      active: true,
    },
    {
      id: 'experiences',
      label: 'Experiences',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/e47ab655-027b-4679-b2e6-df1c99a5c33d.png?im_w=240',
      badge: 'NEW',
    },
    {
      id: 'services',
      label: 'Services',
      icon: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/3d67e9a9-520a-49ee-b439-7b3a75ea814d.png?im_w=240',
      badge: 'NEW',
    },
  ];

  ngOnInit() {
    initFlowbite();
    this.isHostingView = this.router.url.includes('become-a-host');
    this.checkAuthStatus();
    this.authService.token$.subscribe(() => {
      this.checkAuthStatus();
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isHostingView = event.url.includes('become-a-host');
      });
  }

  checkAuthStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
      this.isHost = this.authService.hasRole('Host');
    } else {
      this.currentUser = null;
      this.isHost = false;
      this.isHostingView = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    if (!(event.target as Element).closest('.relative')) {
      this.isDropdownOpen = false;
    }
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

  // Open login modal
  openLoginModal() {
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
    this.authService.becomeHost().subscribe({
      next: (response) => {
        if (response.token) {
          this.authService.updateToken(response.token);
          // Refresh auth status immediately so the UI updates
          this.checkAuthStatus();
        }
        // Switch to hosting view
        this.isHostingView = true;
        this.router.navigate(['/become-a-host']);
        alert('Success! You are now a Host.');
      },
      error: (err) => {
        // If they are already a host, just sync the UI
        if (err.error?.message === 'User is already a Host.') {
          this.checkAuthStatus(); // Update isHost to true
          this.toggleHostingMode(); // Switch them to hosting view
        } else {
          alert(err.error.message || 'Something went wrong');
        }
      },
    });
  }

  toggleHostingMode() {
    this.isHostingView = !this.isHostingView;

    if (this.isHostingView) {
      // Switch to Hosting Dashboard (or intro page for now)
      this.router.navigate(['/become-a-host']);
    } else {
      // Switch to Traveling (Home)
      this.router.navigate(['/']);
    }
  }
}
