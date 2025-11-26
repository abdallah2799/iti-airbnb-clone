import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment.development';

declare var google: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, RouterModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);
  private cdRef = inject(ChangeDetectorRef);

  isOpen = false;
  loginForm: FormGroup;
  errorMessage = '';
  googleInitialized = false;
  googleLoadError = false;
  private googleClientId = environment.googleClientId;
  private googleScriptLoaded = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]],
      rememberMe: [false]
    });

    this.authService.isLoginModalOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) {
        this.errorMessage = '';
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

  private initializeGoogleSignIn(): void {
    console.log('🔧 Initializing Google Sign-In...');
    
    // Check Google Client ID
    if (!this.googleClientId || this.googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      console.error('❌ Google Client ID not configured');
      this.googleLoadError = true;
      this.cdRef.detectChanges();
      return;
    }

    console.log('✅ Google Client ID:', this.googleClientId.substring(0, 20) + '...');

    // Check if container exists and is visible
    const container = document.getElementById('google-button-container-modal');
    if (!container) {
      console.error('❌ Google button container not found');
      setTimeout(() => this.initializeGoogleSignIn(), 100);
      return;
    }

    console.log('✅ Container found, dimensions:', container.offsetWidth, 'x', container.offsetHeight);

    // Clear container
    container.innerHTML = '';

    // Load Google SDK if not already loaded
    this.loadGoogleSDK();
  }

  private loadGoogleSDK(): void {
    console.log('📥 Loading Google SDK...');

    // Check if script is already loaded
    if (typeof google !== 'undefined') {
      console.log('✅ Google SDK already loaded');
      this.renderGoogleButton();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      console.log('✅ Google script already in DOM, waiting for load...');
      this.waitForGoogleSDK();
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google SDK loaded successfully');
      this.googleScriptLoaded = true;
      setTimeout(() => this.renderGoogleButton(), 100);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google SDK:', error);
      this.googleLoadError = true;
      this.googleInitialized = false;
      this.cdRef.detectChanges();
    };
    
    document.head.appendChild(script);
    console.log('📝 Google script added to head');
  }

  private waitForGoogleSDK(retries = 10): void {
    console.log('⏳ Waiting for Google SDK...');
    
    const checkSDK = (attempt: number) => {
      if (typeof google !== 'undefined') {
        console.log('✅ Google SDK is now available');
        this.renderGoogleButton();
        return;
      }

      if (attempt < retries) {
        console.log(`🔄 Waiting for Google SDK... attempt ${attempt + 1}/${retries}`);
        setTimeout(() => checkSDK(attempt + 1), 300);
      } else {
        console.error('❌ Google SDK failed to load after retries');
        this.googleLoadError = true;
        this.googleInitialized = false;
        this.cdRef.detectChanges();
      }
    };

    checkSDK(0);
  }

  private renderGoogleButton(): void {
    try {
      console.log('🎨 Rendering Google button...');

      const container = document.getElementById('google-button-container-modal');
      if (!container) {
        console.error('❌ Container not found during render');
        return;
      }

      // Double check container is visible
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('⚠️ Container has zero dimensions, retrying...');
        setTimeout(() => this.renderGoogleButton(), 200);
        return;
      }

      // Clear container
      container.innerHTML = '';

      console.log('🔧 Initializing Google Identity...');
      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true
      });

      console.log('🎯 Rendering button with width:', container.offsetWidth);
      
      // Render the button
      google.accounts.id.renderButton(
        container,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: container.offsetWidth,
        }
      );

      console.log('✅ Google button rendered successfully!');
      this.googleInitialized = true;
      this.googleLoadError = false;
      this.cdRef.detectChanges();

    } catch (error) {
      console.error('❌ Error rendering Google button:', error);
      this.googleInitialized = false;
      this.googleLoadError = true;
      this.cdRef.detectChanges();
    }
  }

  retryGoogleSignIn(): void {
    console.log('🔄 Retrying Google Sign-In...');
    this.googleLoadError = false;
    this.googleInitialized = false;
    this.cdRef.detectChanges();
    
    setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 100);
  }

  private async handleGoogleSignIn(response: any): Promise<void> {
    console.log('🔐 Google Sign-In response received');
    
    if (!response.credential) {
      this.toastr.error('Google Sign-In failed. No credential received.', 'Error');
      return;
    }

    this.spinner.show();
    
    try {
      const googleToken = response.credential;
      console.log('✅ Google token received');
      
      this.clearGoogleAuthState();
      
      this.authService.registerWithGoogle(googleToken).subscribe({
        next: (authResponse: any) => {
          this.spinner.hide();
          this.handleGoogleAuthSuccess(authResponse);
        },
        error: (error: any) => {
          this.spinner.hide();
          this.handleGoogleAuthError(error);
        }
      });
      
    } catch (error) {
      this.spinner.hide();
      console.error('Google Sign-In error:', error);
      this.toastr.error('Google Sign-In failed. Please try again.', 'Error');
    }
  }

  private handleGoogleAuthSuccess(response: any): void {
    // Note: Manual localStorage setItem removed. AuthService handles token storage.
    if (response.token || response.success) {
      this.toastr.success('Signed in successfully with Google!', 'Welcome');
      this.closeModal();
      this.router.navigate(['/']);
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
          this.closeModal();
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
      }
    } catch (error) {
      console.error('Error clearing Google auth state:', error);
    }
  }

  closeModal() {
    this.authService.closeLoginModal();
    this.errorMessage = '';
    this.loginForm.reset();
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.spinner.show();

      const loginData = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
        rememberMe: this.loginForm.get('rememberMe')?.value || false
      };

      this.authService.login(loginData).subscribe({
        next: (response: any) => {
          this.spinner.hide();
          
          // Note: Manual localStorage setItem for token removed. AuthService handles it.

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
            this.closeModal();
            this.router.navigate(['/']);
          } 
        },
        error: (error: any) => {
          this.spinner.hide();
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

    if (!error.error?.message) {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid email or password.';
          toastTitle = 'Authentication Failed';
          break;
        case 403:
          errorMessage = 'Your account is locked or disabled.';
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
  }

  navigateToForgotPassword(): void {
    this.closeModal();
    this.router.navigate(['/forgot-password']);
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