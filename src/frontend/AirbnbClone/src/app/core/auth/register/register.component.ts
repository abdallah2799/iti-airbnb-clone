import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);

  registerForm: FormGroup;
  errorMessage = '';
  googleLoaded = false;
  isLoading = false;

  readonly icons = { Eye, EyeOff };
  showPassword = false;
  showConfirmPassword = false;
  registrationSuccess = false;

  private readonly GOOGLE_CLIENT_ID = '769814768658-2sqboqvdrghp4qompmtfn76bdd05bfht.apps.googleusercontent.com';

  constructor() {
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
  }

  ngOnInit() {
    this.loadGoogleScript();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        this.initializeGoogleSignIn();
      }
    }, 500);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private loadGoogleScript(): void {
    if (typeof google !== 'undefined' && google.accounts) {
      this.googleLoaded = true;
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        this.googleLoaded = true;
        this.initializeGoogleSignIn();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.googleLoaded = true;
      this.ngZone.run(() => {
        this.initializeGoogleSignIn();
      });
    };
    script.onerror = (error) => {
      this.toastr.error('Failed to load Google Sign-In', 'Error');
    };
    document.head.appendChild(script);
  }

  private initializeGoogleSignIn(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      return;
    }
    try {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          this.ngZone.run(() => {
            this.handleGoogleResponse(response);
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      this.renderGoogleButton();
    } catch (error) {
      this.toastr.error('Failed to initialize Google Sign-In', 'Error');
    }
  }

  private renderGoogleButton(): void {
    const buttonContainer = document.getElementById('google-button-container');

    if (!buttonContainer) {
      return;
    }

    try {
      google.accounts.id.renderButton(
        buttonContainer,
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: buttonContainer.offsetWidth || 400,
          logo_alignment: 'left'
        }
      );
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
  }

  handleGoogleSignIn(): void {

    if (!this.googleLoaded) {
      this.toastr.info('Loading Google Sign-In...', 'Please wait');
      this.loadGoogleScript();
      return;
    }

    if (typeof google === 'undefined' || !google.accounts) {
      this.toastr.error('Google Sign-In is not available', 'Error');
      return;
    }

    try {
      google.accounts.id.prompt((notification: any) => {

        if (notification.isNotDisplayed()) {
          this.toastr.warning('Please click the Google button to sign in', 'Info');
          this.renderGoogleButton();
        } else if (notification.isSkippedMoment()) {
          this.renderGoogleButton();
        }
      });
    } catch (error) {
      this.toastr.error('Failed to open Google Sign-In', 'Error');
    }
  }

  private handleGoogleResponse(response: any): void {

    if (!response || !response.credential) {
      this.toastr.error('Google authentication failed', 'Error');
      return;
    }

    const googleToken = response.credential;
    this.isLoading = true;

    this.authService.registerWithGoogle(googleToken).subscribe({
      next: (authResponse: any) => {
        this.isLoading = false;
        if (authResponse.token) {
          // The AuthService handles storage.
          this.toastr.success('Google authentication successful!', 'Success');
          this.router.navigate(['/']);
        } else {
          console.warn('⚠️ No token in response, but authentication successful');
          this.toastr.success('Authentication completed!', 'Success');
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);

        let errorMessage = 'Google authentication failed. Please try again.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid Google token. Please try again.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        }

        this.toastr.error(errorMessage, 'Authentication Failed');
        this.errorMessage = errorMessage;
      }
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

  hasLowerCase(): boolean {
    const password = this.password?.value;
    return password && /(?=.*[a-z])/.test(password);
  }

  hasUpperCase(): boolean {
    const password = this.password?.value;
    return password && /(?=.*[A-Z])/.test(password);
  }

  hasNumber(): boolean {
    const password = this.password?.value;
    return password && /(?=.*\d)/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.password?.value;
    return password && password.length >= 8;
  }

  onSubmit() {
    console.log('📝 Form submission attempted');
    console.log('Form valid:', this.registerForm.valid);

    if (this.registerForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;

      const formData = {
        email: this.registerForm.get('email')?.value,
        fullName: this.registerForm.get('fullName')?.value,
        password: this.registerForm.get('password')?.value,
        phoneNumber: this.registerForm.get('phoneNumber')?.value || null
      };

      console.log('Sending registration data:', {
        ...formData,
        password: '***hidden***'
      });

      this.authService.register(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('✅ Registration successful:', response);

          if (response.token) {
            // The AuthService handles storage.
            this.toastr.success('Account created successfully!', 'Success');
            this.router.navigate(['/']);
          } else {
            // Registration successful, but email confirmation required
            this.registrationSuccess = true;
            this.toastr.success('Registration successful! Please check your email.', 'Success');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Registration failed. Please try again.';
          this.toastr.error(this.errorMessage, 'Registration Failed');
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          console.log(`  ${key} errors:`, control.errors);
        }
      });

      this.markFormGroupTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Form Validation');
    }
  }

  resendCooldown = 0;
  resendTimer: any;

  resendEmail() {
    const email = this.registerForm.get('email')?.value;
    if (!email) return;

    if (this.resendCooldown > 0) return;

    this.isLoading = true;
    this.authService.resendConfirmationEmail(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('New confirmation email sent! Please check your inbox.', 'Success');
        this.startResendCooldown();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to resend email. Please try again.', 'Error');
      }
    });
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  get fullName() { return this.registerForm.get('fullName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
}