import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-payment-success',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md text-center">
      <div class="mb-4 text-green-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold mb-2 text-gray-800">Payment Successful!</h2>
      <p class="text-gray-600 mb-6">Your booking has been confirmed. You will receive an email shortly.</p>
      <a routerLink="/reservations" class="inline-block py-2 px-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition duration-200">
        View My Trips
      </a>
    </div>
  `
})
export class PaymentSuccessComponent implements OnInit {
    constructor() { }

    ngOnInit(): void { }
}
