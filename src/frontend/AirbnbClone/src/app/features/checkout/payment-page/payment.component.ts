import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../../core/services/stripe.service';
import { BookingService } from '../../../core/services/booking.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
    @ViewChild('paymentElement') paymentElementRef!: ElementRef;

    stripe: Stripe | null = null;
    elements: StripeElements | null = null;
    paymentElement: StripePaymentElement | null = null;

    clientSecret = signal<string>('');
    bookingId = signal<number>(0);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private stripeService: StripeService,
        private bookingService: BookingService
    ) { }

    async ngOnInit() {
        this.route.queryParams.subscribe(async params => {
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
            // Stripe will redirect, so this code might not be reached
        }
    }
}
