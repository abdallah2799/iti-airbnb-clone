import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment.development';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

declare var google: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService);

    loginForm: FormGroup;
    errorMessage = '';
    googleInitialized = false;
    private googleClientId = environment.googleClientId;
    isLoading = false;

    readonly icons = { Eye, EyeOff };
    showPassword = false;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(1)]],
            rememberMe: [false]
        });
    }

    ngOnInit() {
        const rememberedEmail = localStorage.getItem('user_email');
        if (rememberedEmail) {
            this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
        }

        this.initializeGoogleSignIn();

        this.route.queryParams.subscribe((params: any) => {
            if (params['confirmed'] === 'true') {
                this.toastr.success('Account successfully confirmed! You can now log in.', 'Success');

                // Clear the query parameter
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { confirmed: null },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            }
        });
    }

    ngOnDestroy() {
        this.clearGoogleAuthState();
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    private initializeGoogleSignIn(): void {
        if (!this.googleClientId || this.googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
            return;
        }

        if (typeof google !== 'undefined') {
            this.renderGoogleButton();
            return;
        }

        this.loadGoogleSDK();
    }

    private loadGoogleSDK(): void {
        if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
            setTimeout(() => this.renderGoogleButton(), 100);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setTimeout(() => this.renderGoogleButton(), 500);
        };
        script.onerror = (error) => {
            this.googleInitialized = false;
        };
        document.head.appendChild(script);
    }

    private renderGoogleButton(): void {
        try {
            if (typeof google === 'undefined') {
                this.googleInitialized = false;
                return;
            }

            google.accounts.id.initialize({
                client_id: this.googleClientId,
                callback: this.handleGoogleSignIn.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'use',
                ux_mode: 'popup',
                itp_support: true,
                prompt_parent_id: 'google-button-container'
            });

            const container = document.getElementById('google-button-container');
            if (container) {
                container.innerHTML = '';

                google.accounts.id.renderButton(container, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: container.offsetWidth,
                });

                this.googleInitialized = true;

            } else {
                this.googleInitialized = false;
            }

        } catch (error) {
            this.googleInitialized = false;
        }
    }

    private async handleGoogleSignIn(response: any): Promise<void> {
        if (!response.credential) {
            this.toastr.error('Google Sign-In failed. Please try again.', 'Error');
            return;
        }

        this.isLoading = true;

        try {
            const googleToken = response.credential;
            this.clearGoogleAuthState();

            this.authService.registerWithGoogle(googleToken).subscribe({
                next: (authResponse: any) => {
                    this.isLoading = false;
                    this.handleGoogleAuthSuccess(authResponse);
                },
                error: (error: any) => {
                    this.isLoading = false;
                    this.handleGoogleAuthError(error);
                }
            });

        } catch (error) {
            this.isLoading = false;
            this.toastr.error('Google Sign-In failed. Please try again.', 'Error');
        }
    }

    private handleGoogleAuthSuccess(response: any): void {
        // The AuthService has already saved the token via the pipe(tap) operator.

        if (response.token || response.success) {
            this.toastr.success('Signed in successfully!', 'Welcome');

            const isAdmin = this.authService.hasRole('SuperAdmin') || this.authService.hasRole('Admin');
            if (isAdmin) {
                window.location.href = '/admin/dashboard';
            } else {
                this.router.navigate(['/']);
            }
        } else {
            this.toastr.error('Unexpected response from server', 'Error');
        }
    }

    private handleGoogleAuthError(error: any): void {
        let errorMessage = 'Google Sign-In failed. Please try again.';
        let toastTitle = 'Sign-In Failed';

        if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (Array.isArray(error.error)) {
                errorMessage = error.error.join(', ');
            } else if (typeof error.error === 'string') {
                errorMessage = error.error;
            }
        }

        switch (error.status) {
            case 400:
                if (!error.error?.message) {
                    errorMessage = 'Invalid Google token. Please try again.';
                }
                toastTitle = 'Invalid Token';
                break;
            case 404:
                errorMessage = 'Account not found. Please register first.';
                toastTitle = 'Account Not Found';
                setTimeout(() => {
                    this.router.navigate(['/register'], {
                        queryParams: { source: 'google' }
                    });
                }, 3000);
                break;
            case 500:
                errorMessage = 'Server error. Please try again later.';
                toastTitle = 'Server Error';
                break;
        }

        this.toastr.error(errorMessage, toastTitle);
        this.clearGoogleAuthState();
    }

    private clearGoogleAuthState(): void {
        try {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                google.accounts.id.cancel();
                google.accounts.id.disableAutoSelect();

                setTimeout(() => {
                    this.renderGoogleButton();
                }, 100);
            }
        } catch (error) {
            console.error('Error clearing Google auth state:', error);
        }
    }

    retryGoogleSignIn(): void {
        this.googleInitialized = false;
        this.initializeGoogleSignIn();
    }

    handleGoogleSignInManual(): void {
        if (this.googleInitialized) {
            this.toastr.info('Please use the Google button to sign in.', 'Google Sign-In');
        } else {
            this.toastr.warning('Google Sign-In is not available.', 'Sign-In Unavailable');
        }
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.errorMessage = '';
            this.isLoading = true;

            const loginData = {
                email: this.loginForm.get('email')?.value,
                password: this.loginForm.get('password')?.value,
                rememberMe: this.loginForm.get('rememberMe')?.value || false
            };

            this.authService.login(loginData).subscribe({
                next: (response: any) => {
                    this.isLoading = false;

                    // The AuthService already saved the Access & Refresh tokens.

                    if (response.token || response.success) {

                        // Handle "Remember Me" (This is UI preference, so it's okay here)
                        if (loginData.rememberMe) {
                            localStorage.setItem('rememberMe', 'true');
                            localStorage.setItem('user_email', loginData.email);
                        } else {
                            localStorage.removeItem('rememberMe');
                            localStorage.removeItem('user_email');
                        }

                        this.toastr.success('Signed in successfully!', 'Welcome back');
                        // FIX: Check role and redirect accordingly
                        const isAdmin = this.authService.hasRole('SuperAdmin') || this.authService.hasRole('Admin');

                        if (isAdmin) {
                            // Action: Force a full page reload for Admin
                            window.location.href = '/admin/dashboard';
                        } else {
                            this.router.navigate(['/']);
                        }
                    }
                },
                error: (error: any) => {
                    this.isLoading = false;
                    this.handleLoginError(error);
                }
            });
        } else {
            this.markFormGroupTouched();
            this.toastr.warning('Please fill all required fields correctly.', 'Form Validation');
        }
    }

    private handleLoginError(error: any): void {
        let errorMessage = 'An error occurred during sign-in.';
        let toastTitle = 'Sign-In Failed';

        if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (Array.isArray(error.error)) {
                errorMessage = error.error.join(', ');
            } else if (typeof error.error === 'string') {
                errorMessage = error.error;
            }
        }

        // Check for unconfirmed email FIRST (before status code checks)
        const errorCode = error.error?.errorCode;
        const errorMsg = error.error?.message?.toLowerCase() || '';
        const errorsList = error.error?.errors || [];

        const isUnconfirmed = errorCode === 'AUTH_EMAIL_NOT_CONFIRMED' ||
            (errorMsg.includes('email') && errorMsg.includes('confirm')) ||
            errorsList.some((e: string) => e.toLowerCase().includes('email not confirmed'));

        if (isUnconfirmed) {
            // Implicitly resend confirmation email (matching login modal behavior)
            const email = this.loginForm.get('email')?.value;
            if (email) {
                this.resendConfirmationEmail(email);
                return; // Exit after triggering resend
            }
        }

        if (!error.error?.message) {
            switch (error.status) {
                case 401:
                    errorMessage = 'Invalid email or password.';
                    toastTitle = 'Authentication Failed';
                    break;
                case 403:
                    errorMessage = 'Your account is locked, disabled, or email not confirmed.';
                    toastTitle = 'Access Denied';
                    break;
                case 400:
                    errorMessage = 'Please check your email and password format.';
                    toastTitle = 'Invalid Request';
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    toastTitle = 'Server Error';
                    break;
            }
        }

        this.errorMessage = errorMessage;
        this.toastr.error(errorMessage, toastTitle);
        console.error('Sign-in error:', error);
    }

    // Add resend logic
    resendConfirmationEmail(email: string): void {
        this.isLoading = true;
        this.authService.resendConfirmationEmail(email).subscribe({
            next: () => {
                this.isLoading = false;
                this.toastr.success('Account not confirmed. We sent a new confirmation email.', 'Check your inbox');
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    navigateToForgotPassword(): void {
        this.router.navigate(['/forgot-password']);
    }

    navigateToSignup(): void {
        this.router.navigate(['/register']);
    }

    private markFormGroupTouched(): void {
        Object.keys(this.loginForm.controls).forEach(key => {
            const control = this.loginForm.get(key);
            control?.markAsTouched();
        });
    }

    get email() { return this.loginForm.get('email'); }
    get password() { return this.loginForm.get('password'); }
    get rememberMe() { return this.loginForm.get('rememberMe'); }
}