import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, Users, List, BookOpen, MessageSquare, LogOut, Menu, X, ShieldCheck, Trash2, UserX, CheckCircle, Eye } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  unverifiedCount = 0;
  isSidebarOpen = false;

  readonly icons = {
    LayoutDashboard, Users, List, BookOpen, MessageSquare, LogOut, Menu, X, ShieldCheck, Trash2, UserX, CheckCircle, Eye
  };

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadStats();
    // Subscribe to real-time updates
    this.adminService.unverifiedCount$.subscribe(count => {
      this.unverifiedCount = count;
    });
  }

  loadStats() {
    this.adminService.getDashboardData().subscribe({
      next: (data) => {
        // The service updates the subject automatically via tap()
      },
      error: (err) => console.error('Failed to load admin stats', err)
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
