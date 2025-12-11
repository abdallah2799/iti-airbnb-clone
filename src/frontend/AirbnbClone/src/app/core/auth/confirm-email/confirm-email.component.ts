import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.css'
})
export class ConfirmEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  status: 'loading' | 'success' | 'error' = 'loading';
  message = 'Verifying your email...';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const token = params['token'];

      if (userId && token) {
        this.confirmEmail(userId, token);
      } else {
        this.status = 'error';
        this.message = 'Invalid confirmation link.';
      }
    });
  }

  confirmEmail(userId: string, token: string) {
    this.authService.confirmEmail(userId, token).subscribe({
      next: (response: any) => {
        this.status = 'success';
        this.message = 'Account successfully confirmed! You have been logged in.';

        // The AuthService pipe(tap) already handled saving the tokens.

        this.toastr.success('Account successfully confirmed! You have been logged in.', 'Success');

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (error: any) => {
        this.status = 'error';
        this.message = error.error?.message || 'Confirmation failed. The link may be expired or invalid.';
        this.toastr.error(this.message, 'Error');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }
}
