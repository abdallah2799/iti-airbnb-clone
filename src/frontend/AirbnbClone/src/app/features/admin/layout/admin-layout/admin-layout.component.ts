import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, Users, List, BookOpen, MessageSquare, LogOut, Menu, X, ShieldCheck, Trash2, UserX, CheckCircle, Eye } from 'lucide-angular';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ConfirmationDialogComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  unverifiedCount = 0;
  isSidebarOpen = false;
  isSuperAdmin = false;

  readonly icons = {
    LayoutDashboard, Users, List, BookOpen, MessageSquare, LogOut, Menu, X, ShieldCheck, Trash2, UserX, CheckCircle, Eye
  };

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.loadStats();
    // Subscribe to real-time updates
    this.adminService.unverifiedCount$.subscribe(count => {
      this.unverifiedCount = count;
      this.cdr.detectChanges();
    });
  }

  loadStats() {
    this.adminService.getDashboardData().subscribe({
      next: (data) => {
        // The service updates the subject automatically via tap()
        this.cdr.detectChanges();
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
