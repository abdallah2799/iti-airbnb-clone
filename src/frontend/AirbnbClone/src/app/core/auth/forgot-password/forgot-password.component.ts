// forgot-password.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxSpinnerModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);

  forgotPasswordForm: FormGroup;
  errorMessage = '';
  isSubmitted = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.errorMessage = '';
      this.spinner.show();

      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response: any) => {
          this.spinner.hide();
          this.isSubmitted = true;
          
          if (response.message) {
            this.toastr.success(response.message, 'Success');
          } else {
            this.toastr.success(
              'If an account with that email exists, we have sent a password reset link to your email.',
              'Check your email'
            );
          }
        },
        error: (error: any) => {
          this.spinner.hide();
          
          let errorMessage = 'An error occurred while processing your request.';
          let toastTitle = 'Request Failed';

          if (error.error) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (Array.isArray(error.error)) {
              errorMessage = error.error.join(', ');
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }
          }

          if (!error.error?.message) {
            switch (error.status) {
              case 400:
                errorMessage = 'Please enter a valid email address.';
                toastTitle = 'Invalid Email';
                break;
              case 429:
                errorMessage = 'Too many reset attempts. Please try again in a few minutes.';
                toastTitle = 'Too Many Requests';
                break;
              case 500:
                errorMessage = 'Server error. Please try again later.';
                toastTitle = 'Server Error';
                break;
            }
          }

          this.errorMessage = errorMessage;
          this.toastr.error(errorMessage, toastTitle);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please enter a valid email address.', 'Form Validation');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  tryAgain() {
    this.isSubmitted = false;
    this.forgotPasswordForm.reset();
  }

  get email() { return this.forgotPasswordForm.get('email'); }
}