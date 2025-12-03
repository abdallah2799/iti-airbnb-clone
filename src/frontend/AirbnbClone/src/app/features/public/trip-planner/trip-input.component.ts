import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LucideAngularModule, MapPin, Calendar, Users, DollarSign } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

// Type definition for TripSearchCriteria
export interface TripSearchCriteria {
    destination: string;
    startDate: string;
    endDate: string;
    budgetLevel: 'low' | 'medium' | 'high' | 'luxury';
    travelers: { adults: number; children: number };
    interests: string[];
    currency: string;
}

// Budget option interface
interface BudgetOption {
    id: 'low' | 'medium' | 'high' | 'luxury';
    label: string;
    icon: string;
    description: string;
}

// Interest option interface
interface InterestOption {
    id: string;
    label: string;
}

@Component({
    selector: 'app-trip-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './trip-input.component.html',
    styleUrl: './trip-input.component.scss'
})
export class TripInputComponent {
    private fb = inject(FormBuilder);
    private toastr = inject(ToastrService);
    private http = inject(HttpClient);
    private router = inject(Router);

    // Lucide icons
    readonly MapPinIcon = MapPin;
    readonly CalendarIcon = Calendar;
    readonly UsersIcon = Users;
    readonly DollarSignIcon = DollarSign;

    // UI State Signals
    travelersDropdownOpen = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);

    // Form Group
    tripForm: FormGroup;

    // Budget Options
    budgetOptions: BudgetOption[] = [
        { id: 'low', label: 'Budget', icon: '$', description: 'Affordable options' },
        { id: 'medium', label: 'Moderate', icon: '$$', description: 'Comfortable stays' },
        { id: 'high', label: 'Premium', icon: '$$$', description: 'Luxury experiences' },
        { id: 'luxury', label: 'Luxury', icon: '$$$$', description: 'Ultimate indulgence' }
    ];

    // Interest Options
    interestOptions: InterestOption[] = [
        { id: 'history', label: 'History' },
        { id: 'food', label: 'Food' },
        { id: 'museums', label: 'Museums' },
        { id: 'sightseeing', label: 'Sightseeing' },
        { id: 'nature', label: 'Nature' },
        { id: 'shopping', label: 'Shopping' }
    ];

    constructor() {
        // Initialize form with validators
        this.tripForm = this.fb.group({
            destination: ['', [Validators.required, Validators.minLength(2)]],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            budgetLevel: ['medium', Validators.required],
            adults: [1, [Validators.required, Validators.min(1)]],
            children: [0, [Validators.required, Validators.min(0)]],
            interests: [[]],
            currency: ['USD']
        }, { validators: this.dateRangeValidator });
    }

    // Custom validator for date range
    dateRangeValidator(control: AbstractControl): ValidationErrors | null {
        const startDate = control.get('startDate')?.value;
        const endDate = control.get('endDate')?.value;

        if (!startDate || !endDate) {
            return null;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if start date is in the past
        if (start < today) {
            return { pastDate: true };
        }

        // Check if end date is before start date
        if (end <= start) {
            return { invalidDateRange: true };
        }

        return null;
    }

    // Toggle travelers dropdown
    toggleTravelersDropdown() {
        this.travelersDropdownOpen.set(!this.travelersDropdownOpen());
    }

    // Close travelers dropdown
    closeTravelersDropdown() {
        this.travelersDropdownOpen.set(false);
    }

    // Increment/Decrement travelers
    incrementAdults() {
        const current = this.tripForm.get('adults')?.value || 0;
        this.tripForm.patchValue({ adults: current + 1 });
    }

    decrementAdults() {
        const current = this.tripForm.get('adults')?.value || 1;
        if (current > 1) {
            this.tripForm.patchValue({ adults: current - 1 });
        }
    }

    incrementChildren() {
        const current = this.tripForm.get('children')?.value || 0;
        this.tripForm.patchValue({ children: current + 1 });
    }

    decrementChildren() {
        const current = this.tripForm.get('children')?.value || 0;
        if (current > 0) {
            this.tripForm.patchValue({ children: current - 1 });
        }
    }

    // Get total travelers count
    get totalTravelers(): number {
        const adults = this.tripForm.get('adults')?.value || 0;
        const children = this.tripForm.get('children')?.value || 0;
        return adults + children;
    }

    // Select budget level
    selectBudget(budgetId: 'low' | 'medium' | 'high' | 'luxury') {
        this.tripForm.patchValue({ budgetLevel: budgetId });
    }

    // Check if budget is selected
    isBudgetSelected(budgetId: string): boolean {
        return this.tripForm.get('budgetLevel')?.value === budgetId;
    }

    // Toggle interest
    toggleInterest(interestId: string) {
        const currentInterests = this.tripForm.get('interests')?.value || [];
        const index = currentInterests.indexOf(interestId);

        if (index > -1) {
            // Remove interest
            currentInterests.splice(index, 1);
        } else {
            // Add interest
            currentInterests.push(interestId);
        }

        this.tripForm.patchValue({ interests: [...currentInterests] });
    }

    // Check if interest is selected
    isInterestSelected(interestId: string): boolean {
        const interests = this.tripForm.get('interests')?.value || [];
        return interests.includes(interestId);
    }

    // Get form control for error checking
    getControl(controlName: string) {
        return this.tripForm.get(controlName);
    }

    // Check if field has error
    hasError(controlName: string, errorType: string): boolean {
        const control = this.getControl(controlName);
        return !!(control?.hasError(errorType) && (control?.dirty || control?.touched));
    }

    // Submit form
    onSubmit() {
        if (this.tripForm.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.tripForm.controls).forEach(key => {
                this.tripForm.get(key)?.markAsTouched();
            });
            this.toastr.error('Please fill in all required fields correctly');
            return;
        }

        this.isSubmitting.set(true);

        // Prepare data in TripSearchCriteria format
        const formValue = this.tripForm.value;
        const tripData: TripSearchCriteria = {
            destination: formValue.destination,
            startDate: formValue.startDate,
            endDate: formValue.endDate,
            budgetLevel: formValue.budgetLevel,
            travelers: {
                adults: formValue.adults,
                children: formValue.children
            },
            interests: formValue.interests,
            currency: formValue.currency
        };

        // Call n8n webhook
        const webhookUrl = 'https://abdullah-ragab.app.n8n.cloud/webhook-test/plan-trip';

        this.http.post(webhookUrl, tripData).subscribe({
            next: (response) => {
                this.isSubmitting.set(false);
                this.toastr.success('Trip itinerary generated successfully!');

                // Navigate to result page with response data
                this.router.navigate(['/trip-result'], {
                    state: { tripData: response }
                });
            },
            error: (error) => {
                this.isSubmitting.set(false);
                console.error('Error calling n8n webhook:', error);
                this.toastr.error('Failed to generate trip itinerary. Please try again.');
            }
        });
    }

    // Get minimum date for date picker (today)
    get minDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // Get minimum end date (start date + 1 day)
    get minEndDate(): string {
        const startDate = this.tripForm.get('startDate')?.value;
        if (!startDate) return this.minDate;

        const start = new Date(startDate);
        start.setDate(start.getDate() + 1);
        return start.toISOString().split('T')[0];
    }
}
