import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../../core/services/stripe.service';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
    @ViewChild('paymentElement') paymentElementRef!: ElementRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private stripeService = inject(StripeService);
    private bookingService = inject(BookingService);
    private paymentService = inject(PaymentService);
    private destroyRef = inject(DestroyRef);

    stripe: Stripe | null = null;
    elements: StripeElements | null = null;
    paymentElement: StripePaymentElement | null = null;

    clientSecret = signal<string>('');
    bookingId = signal<number>(0);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');
    paymentCompleted = false;

    async ngOnInit() {
        // Add event listener for manual URL changes or browser close
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(async params => {
            this.clientSecret.set(params['clientSecret']);
            this.bookingId.set(Number(params['bookingId']));

            if (!this.clientSecret()) {
                this.errorMessage.set('Missing payment information.');
                this.isLoading.set(false);
                return;
            }

            this.stripe = await this.stripeService.getStripe();
            if (!this.stripe) {
                this.errorMessage.set('Failed to load Stripe.');
                this.isLoading.set(false);
                return;
            }

            this.initializePaymentElement();
        });
    }

    async initializePaymentElement() {
        if (!this.stripe || !this.clientSecret()) return;

        const appearance = { /* appearance options */ };
        // @ts-ignore
        this.elements = this.stripe.elements({ clientSecret: this.clientSecret(), appearance });

        this.paymentElement = this.elements.create('payment');
        this.paymentElement.mount(this.paymentElementRef.nativeElement);

        this.isLoading.set(false);
    }

    async handleSubmit() {
        if (!this.stripe || !this.elements) return;

        this.isLoading.set(true);

        const { error } = await this.stripe.confirmPayment({
            elements: this.elements,
            confirmParams: {
                // Return URL where Stripe redirects after payment
                return_url: `${window.location.origin}/payment/success`,
            },
        });

        if (error) {
            this.errorMessage.set(error.message || 'An unexpected error occurred.');
            this.isLoading.set(false);
        } else {
            // Mark payment as completed to prevent cancellation
            this.paymentCompleted = true;
        }
    }

    private handleBeforeUnload(event: BeforeUnloadEvent) {
        // Cancel pending booking when user manually changes URL or closes browser
        if (!this.paymentCompleted && this.bookingId() > 0) {
            // Use sendBeacon for reliable async request on page unload
            const url = `${window.location.origin}/api/payments/cancel-pending-booking/${this.bookingId()}`;
            const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        }
    }

    ngOnDestroy() {
        // Remove event listener
        window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        // Cancel pending booking if user navigates away without completing payment
        if (!this.paymentCompleted && this.bookingId() > 0) {
            this.paymentService.cancelPendingBooking(this.bookingId()).subscribe({
                next: () => console.log('Pending booking deleted'),
                error: (err) => console.error('Failed to delete pending booking:', err)
            });
        }
    }
}
