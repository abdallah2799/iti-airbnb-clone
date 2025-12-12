import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment.development';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';

declare var google: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private toastr = inject(ToastrService);
  private cdRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('googleBtnContainer') googleBtnContainer!: ElementRef;
  isLoading = false;

  isOpen = false;
  viewMode: 'login' | 'signup' = 'login';

  loginForm: FormGroup;
  registerForm: FormGroup;

  errorMessage = '';
  googleInitialized = false;
  googleLoadError = false;
  private googleClientId = environment.googleClientId;

  // Password Visibility Toggles
  showPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;

  readonly icons = { Eye, EyeOff };

  // Registration Success State

  resendCooldown = 0;
  private resendTimer: any;

  constructor() {
    // Login Form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]],
      rememberMe: [false]
    });

    // Register Form
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', Validators.required],
      phoneNumber: ['']
    }, { validators: this.passwordMatchValidator });

    this.authService.isLoginModalOpen$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(open => {
      this.isOpen = open;
      if (open) {
        this.errorMessage = '';
        this.viewMode = 'login';
        // Wait for modal to be fully rendered in DOM
        setTimeout(() => {
          this.initializeGoogleSignIn();
        }, 500);
      }
    });
  }

  ngOnInit() {
    const rememberedEmail = localStorage.getItem('user_email');
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

  ngOnDestroy() {
    this.clearGoogleAuthState();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'login' ? 'signup' : 'login';
    this.errorMessage = '';
  }

  // --- Google Sign-In Logic (Matched to LoginComponent) ---

  private initializeGoogleSignIn(): void {
    if (!this.googleClientId || this.googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      console.error('❌ Google Client ID not configured');
      this.googleLoadError = true;
      this.cdRef.detectChanges();
      return;
    }

    // Check for google.accounts to avoid conflict with Google Maps
    if (typeof google !== 'undefined' && google?.accounts) {
      this.renderGoogleButton();
      return;
    }

    this.loadGoogleSDK();
  }

  private loadGoogleSDK(): void {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      // Script exists, poll for google.accounts
      const checkGoogleAccounts = setInterval(() => {
        if (typeof google !== 'undefined' && google?.accounts) {
          clearInterval(checkGoogleAccounts);
          this.renderGoogleButton();
        }
      }, 100);
      setTimeout(() => clearInterval(checkGoogleAccounts), 5000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Poll for google.accounts after load
      const checkGoogleAccounts = setInterval(() => {
        if (typeof google !== 'undefined' && google?.accounts) {
          clearInterval(checkGoogleAccounts);
          this.renderGoogleButton();
        }
      }, 100);
      setTimeout(() => clearInterval(checkGoogleAccounts), 5000);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google SDK:', error);
      this.googleLoadError = true;
      this.googleInitialized = false;
      this.cdRef.detectChanges();
    };

    document.head.appendChild(script);
  }

  private renderGoogleButton(): void {
    try {
      // Explicitly check for google.accounts
      if (typeof google === 'undefined' || !google?.accounts) {
        console.warn('⚠️ Google SDK not loaded yet');
        this.googleInitialized = false;
        return;
      }

      // Use ViewChild to get the container
      if (!this.googleBtnContainer || !this.googleBtnContainer.nativeElement) {
        console.error('❌ Google button container not found (ViewChild is null)');
        // Retry if container is missing (e.g. modal animation delay)
        setTimeout(() => this.renderGoogleButton(), 500);
        return;
      }

      const container = this.googleBtnContainer.nativeElement;

      // Check visibility
      if (container.offsetParent === null) {
        console.warn('⚠️ Container is not visible (offsetParent is null). Retrying...');
        setTimeout(() => this.renderGoogleButton(), 500);
        return;
      }

      console.log('🎨 Rendering Google Button into ViewChild container');
      console.log('📏 Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);

      // Clear container
      container.innerHTML = '';

      if (google.accounts.id) {
        // Cancel any existing instance to ensure clean state
        google.accounts.id.cancel();

        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: this.handleGoogleSignIn.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          itp_support: true,
        });

        const width = container.offsetWidth > 0 ? container.offsetWidth : 300;
        console.log('📏 Rendering with width:', width);

        google.accounts.id.renderButton(
          container,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: width,
          }
        );

        console.log('✅ Google Button render call completed');
        this.googleInitialized = true;
        this.googleLoadError = false;
        this.cdRef.detectChanges();
      }

    } catch (error) {
      console.error('❌ Error rendering Google button:', error);
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
    if (response.token || response.success) {
      this.toastr.success('Signed in successfully!', 'Welcome');
      this.closeModal();

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
        // Auto-switch to signup mode instead of navigating away
        setTimeout(() => {
          this.viewMode = 'signup';
          this.errorMessage = errorMessage;
          this.cdRef.detectChanges();
        }, 1000);
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        toastTitle = 'Server Error';
        break;
    }

    this.toastr.error(errorMessage, toastTitle);
    this.clearGoogleAuthState();
  }

  retryGoogleSignIn() {
    this.googleLoadError = false;
    this.initializeGoogleSignIn();
  }

  private clearGoogleAuthState(): void {
    try {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.cancel();
        google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      console.error('Error clearing Google auth state:', error);
    }
  }

  // --- Form Submission Logic ---

  closeModal() {
    this.authService.closeLoginModal();
    this.errorMessage = '';
    this.loginForm.reset();
    this.registerForm.reset();
    this.viewMode = 'login';
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  onLoginSubmit() {
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
          if (response.token || response.success) {
            if (loginData.rememberMe) {
              localStorage.setItem('rememberMe', 'true');
              localStorage.setItem('user_email', loginData.email);
            } else {
              localStorage.removeItem('rememberMe');
              localStorage.removeItem('user_email');
            }
            this.toastr.success('Signed in successfully!', 'Welcome back');
            this.closeModal();

            // FIX: Check role and redirect accordingly
            const isAdmin = this.authService.hasRole('SuperAdmin') || this.authService.hasRole('Admin');

            if (isAdmin) {
              // Action: Force a full page reload for Admin to ensure clean state
              window.location.href = '/admin/dashboard';
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleAuthError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;

      const formData = {
        email: this.registerForm.get('email')?.value,
        fullName: this.registerForm.get('fullName')?.value,
        password: this.registerForm.get('password')?.value,
        phoneNumber: this.registerForm.get('phoneNumber')?.value || null
      };

      this.authService.register(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.token) {
            this.toastr.success('Account created successfully!', 'Success');
            this.closeModal();
            this.router.navigate(['/']);
          } else {
            // Email confirmation required
            if (response.emailSent === false) {
              // Email failed to send - show toast and don't show success view
              this.toastr.error('Registration successful, but we couldn\'t send the confirmation email. Please try again later.', 'Email Error', {
                timeOut: 5000
              });
              // Stay on register page as per requirements
            } else {
              // Email sent successfully - redirect to check-email page
              localStorage.setItem('registered_email', formData.email);
              this.toastr.success('Registration successful. Please check your email to confirm your account.', 'Success');
              this.closeModal();
            }
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleAuthError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  private handleAuthError(error: any): void {
    let msg = 'Authentication failed.';
    if (error.error?.message) {
      msg = error.error.message;
    } else if (error.status === 401) {
      msg = 'Invalid credentials.';
    }

    // Define error variables
    const errorMsg = error.error?.message?.toLowerCase() || '';
    const errorsList = error.error?.errors || [];
    const errorCode = error.error?.errorCode; // Check for specific error code from backend

    // Check for suspended account
    const isSuspended = errorCode === 'AUTH_SUSPENDED' ||
      errorMsg.includes('suspended') ||
      errorsList.some((e: string) => e.toLowerCase().includes('account suspended'));

    if (isSuspended) {
      this.confirmationDialog.confirm({
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support for assistance.',
        confirmText: 'OK',
        cancelText: '',
        confirmColor: 'danger',
        icon: 'error'
      }).subscribe();
      return;
    }

    // Check for unconfirmed email error
    const isUnconfirmed = errorCode === 'AUTH_EMAIL_NOT_CONFIRMED' ||
      (errorMsg.includes('email') && errorMsg.includes('confirm')) ||
      errorsList.some((e: string) => e.toLowerCase().includes('email not confirmed'));

    if (isUnconfirmed) {
      // Requirement: Implicitly resend confirmation email
      const email = this.loginForm.get('email')?.value;
      if (email) {
        this.resendConfirmationEmail(email, true);
      }
      return;
    }

    this.errorMessage = msg;
    this.toastr.error(msg, 'Error');
  }



  navigateToForgotPassword(): void {
    this.closeModal();
    this.router.navigate(['/forgot-password']);
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
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

  resendConfirmationEmail(email: string, auto: boolean = false): void {
    if (this.resendCooldown > 0) {
      if (!auto) this.toastr.info(`Please wait ${this.resendCooldown}s before resending.`, 'Info');
      return;
    }

    this.isLoading = true;
    this.authService.resendConfirmationEmail(email).subscribe({
      next: () => {
        this.isLoading = false;
        const msg = auto ? 'Account not confirmed. We sent a new confirmation email.' : 'New confirmation email sent!';
        this.toastr.success(msg, 'Check your inbox');
        this.startResendCooldown();
      },
      error: () => {
        this.isLoading = false;
        if (!auto) this.toastr.error('Failed to resend email. Please try again.', 'Error');
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  // Getters for template
  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('password'); }

  get regFullName() { return this.registerForm.get('fullName'); }
  get regEmail() { return this.registerForm.get('email'); }
  get regPassword() { return this.registerForm.get('password'); }
  get regConfirmPassword() { return this.registerForm.get('confirmPassword'); }
}