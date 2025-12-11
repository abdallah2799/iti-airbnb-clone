import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-set-password-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule],
    templateUrl: './set-password-modal.component.html',
    styleUrls: ['./../change-password/change-password.component.css']
})
export class SetPasswordModalComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService);
    private spinner = inject(NgxSpinnerService);
    private toastr = inject(ToastrService);

    setPasswordForm: FormGroup;
    errorMessage = '';
    isSubmitted = false;
    showNewPassword = false;
    showConfirmPassword = false;

    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    constructor() {
        this.setPasswordForm = this.fb.group({
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
            ]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        // Modal is controlled externally via isOpen property
    }

    open() {
        this.isOpen = true;
        this.setPasswordForm.reset();
        this.errorMessage = '';
        this.isSubmitted = false;
    }

    closeModal() {
        // Don't emit close event - modal stays open until password is set successfully
        // User can only close by clicking outside or X button, which keeps them on security tab
        this.isOpen = false;
        this.setPasswordForm.reset();
        this.errorMessage = '';
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

    togglePasswordVisibility(field: 'new' | 'confirm') {
        if (field === 'new') {
            this.showNewPassword = !this.showNewPassword;
        } else {
            this.showConfirmPassword = !this.showConfirmPassword;
        }
    }

    onSubmit() {
        if (this.setPasswordForm.valid) {
            this.errorMessage = '';
            this.spinner.show();

            const passwordData = {
                currentPassword: '', // Empty for Google users
                newPassword: this.setPasswordForm.get('newPassword')?.value,
                confirmPassword: this.setPasswordForm.get('confirmPassword')?.value
            };

            this.authService.changePassword(passwordData).subscribe({
                next: (response: any) => {
                    this.spinner.hide();
                    this.isSubmitted = true;

                    if (response.message) {
                        this.toastr.success(response.message, 'Success');
                    } else {
                        this.toastr.success('Password set successfully! You can now login with email and password.', 'Success');
                    }

                    setTimeout(() => {
                        this.isSubmitted = false;
                        // Refresh user data to update hasPassword flag
                        this.authService.validateToken().subscribe(() => {
                            this.close.emit();
                        });
                    }, 2000);
                },
                error: (error: any) => {
                    this.spinner.hide();
                    this.handleSetPasswordError(error);
                }
            });
        } else {
            this.markFormGroupTouched();
            this.toastr.warning('Please fill all required fields correctly.', 'Form Validation');
        }
    }

    private handleSetPasswordError(error: any): void {
        let errorMessage = 'An error occurred while setting your password.';
        let toastTitle = 'Password Set Failed';

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
                    errorMessage = 'Password does not meet requirements.';
                }
                break;
            case 401:
                toastTitle = 'Authentication Failed';
                if (!error.error?.message) {
                    errorMessage = 'Your session has expired. Please log in again.';
                }
                setTimeout(() => {
                    this.close.emit();
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
        Object.keys(this.setPasswordForm.controls).forEach(key => {
            const control = this.setPasswordForm.get(key);
            control?.markAsTouched();
        });
    }

    stopPropagation(event: Event) {
        event.stopPropagation();
    }

    get newPassword() { return this.setPasswordForm.get('newPassword'); }
    get confirmPassword() { return this.setPasswordForm.get('confirmPassword'); }
}
