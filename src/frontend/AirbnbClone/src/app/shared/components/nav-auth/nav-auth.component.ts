import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Add this import
import { initFlowbite } from 'flowbite';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-nav-auth',
  imports: [CommonModule, LucideAngularModule], // Add CommonModule here
  templateUrl: './nav-auth.component.html',
  styleUrl: './nav-auth.component.css',
})
export class NavAuthComponent {
  constructor(private authService: AuthService) {}
  
  isScrolled = false;
  isDropdownOpen = false;
  isMobileMenuOpen = false;

  ngOnInit() {
    initFlowbite();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    const target = event.target as Element;
    if (!target.closest('.relative')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation(); // Prevent immediate closing
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  openLoginModal() {
    this.authService.openLoginModal();
  }
}