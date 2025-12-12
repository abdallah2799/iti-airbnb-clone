import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { AllListingsComponent } from './listings/all-listings/all-listings.component';
import { UnverifiedListingsComponent } from './listings/unverified-listings/unverified-listings.component';
import { BookingsComponent } from './bookings/bookings.component';
import { ReviewsComponent } from './reviews/reviews.component';

const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { 
                path: '', 
                redirectTo: 'dashboard', 
                pathMatch: 'full' 
            },
            { 
                path: 'dashboard', 
                component: DashboardComponent, 
                title: 'Admin Dashboard'
            },
            { 
                path: 'users', 
                component: UsersComponent, 
                title: 'Manage Users'
            },
            { 
                path: 'all-listings', 
                component: AllListingsComponent, 
                title: 'All Listings'
            },
            { 
                path: 'unverified-listings', 
                component: UnverifiedListingsComponent, 
                title: 'Unverified Listings'
            },
            { 
                path: 'bookings', 
                component: BookingsComponent, 
                title: 'Manage Bookings'
            },
            { 
                path: 'reviews', 
                component: ReviewsComponent, 
                title: 'Manage Reviews'
            },
            {
                path: 'profile',
                loadComponent: () => import('./profile/admin-profile.component').then(m => m.AdminProfileComponent),
                title: 'My Profile'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
