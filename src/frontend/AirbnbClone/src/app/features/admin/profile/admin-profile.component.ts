import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileComponent } from '../../guest/profile/user-profile.component';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, UserProfileComponent],
  template: `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Reuse the Guest Profile Component but wrapped for Admin context -->
      <app-user-profile></app-user-profile>
    </div>
  `
})
export class AdminProfileComponent { }
