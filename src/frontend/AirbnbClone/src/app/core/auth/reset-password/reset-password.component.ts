// reset-password.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxSpinnerModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);

  resetPasswordForm: FormGroup;
  errorMessage = '';
  isSubmitted = false;
  token = '';
  userEmail = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Get token and email from URL parameters (matching your C# backend)
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.userEmail = params['email'] || '';
      
      console.log('Token from URL:', this.token);
      console.log('Email from URL:', this.userEmail);
      
      // Pre-fill the email field if provided in URL
      if (this.userEmail) {
        this.resetPasswordForm.patchValue({
          email: this.userEmail
        });
        
        // Optional: disable email field if pre-filled from URL
        // this.emailControl?.disable();
      }
      
      if (!this.token) {
        this.errorMessage = 'Invalid reset link. The link is missing the reset token. Please use the link from your email.';
        this.toastr.error('Missing reset token', 'Error');
      }
      
      if (!this.userEmail) {
        this.errorMessage = 'Invalid reset link. The link is missing the email address. Please use the link from your email.';
        this.toastr.error('Missing email', 'Error');
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    return null;
  }

  // Password validation methods
  hasLowerCase(): boolean {
    const password = this.newPassword?.value;
    return password && /(?=.*[a-z])/.test(password);
  }

  hasUpperCase(): boolean {
    const password = this.newPassword?.value;
    return password && /(?=.*[A-Z])/.test(password);
  }

  hasNumber(): boolean {
    const password = this.newPassword?.value;
    return password && /(?=.*\d)/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.newPassword?.value;
    return password && password.length >= 8;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && this.token) {
      this.errorMessage = '';
      this.spinner.show();

      const resetData = {
        email: this.resetPasswordForm.get('email')?.value,
        newPassword: this.resetPasswordForm.get('newPassword')?.value,
        token: this.token
      };

      console.log('Sending reset data:', { ...resetData, token: '***' }); // Log without exposing full token

      this.authService.resetPassword(resetData).subscribe({
        next: (response: any) => {
          this.spinner.hide();
          this.isSubmitted = true;
          
          if (response.message) {
            this.toastr.success(response.message, 'Success');
          } else {
            this.toastr.success('Password reset successful! You can now login with your new password.', 'Success');
          }
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error: any) => {
          this.spinner.hide();
          
          let errorMessage = 'Failed to reset password. Please try again.';
          let toastTitle = 'Error';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid reset token or email. The link may have expired.';
            toastTitle = 'Invalid Request';
          } else if (error.status === 410) {
            errorMessage = 'Reset link has expired. Please request a new password reset link.';
            toastTitle = 'Expired Link';
          }
          
          this.errorMessage = errorMessage;
          this.toastr.error(errorMessage, toastTitle);
        }
      });
    } else {
      this.markFormGroupTouched();
      if (!this.token) {
        this.errorMessage = 'Invalid reset link. Please use the link from your email.';
        this.toastr.error('Invalid reset link', 'Error');
      } else {
        this.toastr.warning('Please fill all required fields correctly.', 'Form Validation');
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  requestNewLink() {
    this.router.navigate(['/forgot-password']);
  }

  get emailControl() { return this.resetPasswordForm.get('email'); }
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }
}