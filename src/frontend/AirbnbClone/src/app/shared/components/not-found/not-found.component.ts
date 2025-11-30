import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <h1 class="text-9xl font-bold text-[#FF385C]">404</h1>
      <h2 class="text-3xl font-semibold mt-4 mb-6">Page Not Found</h2>
      <p class="text-gray-500 text-lg mb-8 max-w-md">
        We can't seem to find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <a routerLink="/" class="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
        Go Home
      </a>
    </div>
  `
})
export class NotFoundComponent { }
