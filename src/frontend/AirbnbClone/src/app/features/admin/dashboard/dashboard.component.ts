import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardDto } from '../../../core/models/admin.interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6" *ngIf="dashboardData$ | async as data; else loading">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Users -->
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase font-semibold">Total Users</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ data.totalUsers }}</h3>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            <span class="text-green-500 font-medium">{{ data.totalActiveUsers }}</span> active
          </p>
        </div>

        <!-- Total Listings -->
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-rose-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase font-semibold">Total Listings</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ data.totalListings }}</h3>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            <span class="text-green-500 font-medium">{{ data.totalPublishedListings }}</span> published
          </p>
        </div>

        <!-- Total Bookings -->
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-amber-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase font-semibold">Total Bookings</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ data.totalBookings }}</h3>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            <span class="text-orange-500 font-medium">{{ data.totalPendingBookings }}</span> pending
          </p>
        </div>

        <!-- Suspended Users (Alert) -->
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 uppercase font-semibold">Suspended Users</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ data.totalSuspendedUsers }}</h3>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">Action required</p>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Bookings -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-800">Recent Bookings</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div *ngFor="let booking of data.recentBookings" class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-800">{{ booking.listingTitle }}</p>
                  <p class="text-sm text-gray-500">by {{ booking.guestName }}</p>
                </div>
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                  [ngClass]="{
                    'bg-green-100 text-green-800': booking.status === 'Confirmed',
                    'bg-yellow-100 text-yellow-800': booking.status === 'Pending',
                    'bg-red-100 text-red-800': booking.status === 'Cancelled'
                  }">
                  {{ booking.status }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ booking.bookingDate | date:'mediumDate' }}</p>
            </div>
            <div *ngIf="data.recentBookings.length === 0" class="p-4 text-center text-gray-500">
              No recent bookings.
            </div>
          </div>
        </div>

        <!-- Recent Listings -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-800">New Listings</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div *ngFor="let listing of data.recentListings" class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-800">{{ listing.title }}</p>
                  <p class="text-sm text-gray-500">Host: {{ listing.hostName }}</p>
                </div>
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                  [ngClass]="{
                    'bg-green-100 text-green-800': listing.status === 'Published',
                    'bg-gray-100 text-gray-800': listing.status === 'Draft',
                    'bg-yellow-100 text-yellow-800': listing.status === 'UnderReview',
                    'bg-red-100 text-red-800': listing.status === 'Suspended'
                  }">
                  {{ listing.status }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ listing.createdAt | date:'mediumDate' }}</p>
            </div>
            <div *ngIf="data.recentListings.length === 0" class="p-4 text-center text-gray-500">
              No recent listings.
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    </ng-template>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  dashboardData$!: Observable<AdminDashboardDto>;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.dashboardData$ = this.adminService.getDashboardData();
  }
}
