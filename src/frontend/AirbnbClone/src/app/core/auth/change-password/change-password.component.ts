// change-password.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isSubmitted = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.toastr.error('Please log in to change your password.', 'Authentication Required');
      this.router.navigate(['/login']);
      return;
    }
  }

  // Custom validator to check if new password is different from current password
  differentPasswordValidator(control: AbstractControl) {
    const currentPassword = control.get('currentPassword')?.value;
    const newPassword = control.get('newPassword')?.value;
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
      return { sameAsCurrent: true };
    }
    return null;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      const errors = confirmPassword?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword?.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

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

  isDifferentFromCurrent(): boolean {
    const currentPassword = this.currentPassword?.value;
    const newPassword = this.newPassword?.value;
    return !!(currentPassword && newPassword && currentPassword !== newPassword);
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      if (!this.isDifferentFromCurrent()) {
        this.errorMessage = 'New password must be different from current password.';
        this.toastr.warning('New password must be different from current password.', 'Password Change');
        return;
      }

      this.errorMessage = '';
      this.isLoading = true;

      const changePasswordData = {
        currentPassword: this.changePasswordForm.get('currentPassword')?.value,
        newPassword: this.changePasswordForm.get('newPassword')?.value,
        confirmPassword: this.changePasswordForm.get('confirmPassword')?.value
      };


      this.authService.changePassword(changePasswordData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSubmitted = true;
          
          
          if (response.message) {
            this.toastr.success(response.message, 'Success');
          } else {
            this.toastr.success('Password changed successfully!', 'Success');
          }
          
          this.changePasswordForm.reset();
          
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleChangePasswordError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Form Validation');
    }
  }

  private handleChangePasswordError(error: any): void {
    let errorMessage = 'An error occurred while changing your password.';
    let toastTitle = 'Password Change Failed';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.title) {
        errorMessage = error.error.title;
        if (error.error.detail) {
          errorMessage += ': ' + error.error.detail;
        }
      } else if (error.error.errors) {
        const validationErrors = [];
        for (const key in error.error.errors) {
          if (error.error.errors.hasOwnProperty(key)) {
            validationErrors.push(...error.error.errors[key]);
          }
        }
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join(', ');
        }
      }
    }

    switch (error.status) {
      case 400:
        toastTitle = 'Invalid Request';
        if (!error.error?.message) {
          errorMessage = 'Invalid request. New password does not meet requirements or validation failed.';
        }
        break;
      case 401:
        toastTitle = 'Authentication Failed';
        if (!error.error?.message) {
          errorMessage = 'Current password is incorrect or your session has expired. Please log in again.';
        }
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
        break;
      case 500:
        toastTitle = 'Server Error';
        if (!error.error?.message) {
          errorMessage = 'Server error. Please try again later.';
        }
        break;
      case 0:
        toastTitle = 'Network Error';
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        break;
    }

    this.errorMessage = errorMessage;
    this.toastr.error(errorMessage, toastTitle);
    
  }

  private markFormGroupTouched() {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }
}