import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);

  registerForm: FormGroup;
  errorMessage = '';
  googleLoaded = false;

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
    this.spinner.show();

    this.authService.registerWithGoogle(googleToken).subscribe({
      next: (authResponse: any) => {
        this.spinner.hide();
        if (authResponse.token) {
          // --- CHANGE: Removed manual localStorage.setItem ---
          // The AuthService handles storage.
          this.toastr.success('Google authentication successful!', 'Success');
          
          // --- CHANGE: Fixed Navigation ---
          // Previously this went to /login, but if we have a token, we are logged in.
          // Redirecting to Home (/) is the correct behavior.
          this.router.navigate(['/']); 
        } else {
          console.warn('⚠️ No token in response, but authentication successful');
          this.toastr.success('Authentication completed!', 'Success');
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.spinner.hide();
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
      this.spinner.show();

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
          this.spinner.hide();
          console.log('✅ Registration successful:', response);
          
          if (response.token) {
            // --- CHANGE: Removed manual localStorage.setItem ---
            // The AuthService handles storage.
            this.toastr.success('Account created successfully!', 'Success');
            this.router.navigate(['/']);
          } else {
            this.toastr.success('Registration completed!', 'Success');
            this.router.navigate(['/login']);
          }
        },
        error: (error) => {
          this.spinner.hide();
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