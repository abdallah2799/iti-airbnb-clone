import { Component, Input, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Listing } from '../../../core/models/listing.interface';
import { ListingCardComponent } from '../listing-card/listing-card.component';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-listing-row',
  standalone: true,
  imports: [CommonModule, ListingCardComponent, LucideAngularModule],
  template: `
    <div class="py-8 border-b border-gray-100 last:border-0">
      <div class="flex items-center justify-between mb-6 px-1">
        <div 
          (click)="onTitleClick()"
          class="group flex items-center gap-2 cursor-pointer"
        >
          <h2 class="text-2xl font-bold text-gray-900 group-hover:text-[#FF385C] transition-colors">{{ title }}</h2>
          <lucide-icon [img]="icons.ChevronRight" class="w-5 h-5 text-gray-400 group-hover:text-[#FF385C] transition-colors opacity-0 group-hover:opacity-100"></lucide-icon>
        </div>
        
        <!-- Navigation Buttons (Desktop) -->
        <div class="hidden md:flex gap-2">
          <button 
            *ngIf="canScrollLeft"
            (click)="scroll('left')"
            class="p-2 rounded-full border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors bg-white z-10"
          >
            <lucide-icon [img]="icons.ChevronLeft" class="w-4 h-4"></lucide-icon>
          </button>
          <button 
            *ngIf="canScrollRight"
            (click)="scroll('right')"
            class="p-2 rounded-full border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors bg-white z-10"
          >
            <lucide-icon [img]="icons.ChevronRight" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="relative group/row">
        <!-- Scroll Container -->
        <div 
          #scrollContainer
          class="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          (scroll)="checkScroll()"
        >
          <div 
            *ngFor="let listing of listings" 
            style="flex: 0 0 200px; width: 200px; min-width: 200px;"
            class="cursor-pointer group/card"
          >
            <app-listing-card [listing]="listing"></app-listing-card>
          </div>
        </div>
      </div>  
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class ListingRowComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) listings: Listing[] = [];

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private router = inject(Router);

  canScrollLeft = false;
  canScrollRight = true;

  readonly icons = { ChevronLeft, ChevronRight };

  onTitleClick() {
    const location = this.title.replace('Stays in ', '');
    this.router.navigate(['/searchMap'], { queryParams: { location } });
  }

  scroll(direction: 'left' | 'right') {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of width

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    // Check scroll status after animation
    setTimeout(() => this.checkScroll(), 500);
  }

  checkScroll() {
    const container = this.scrollContainer.nativeElement;
    this.canScrollLeft = container.scrollLeft > 0;
    // Allow a small buffer (10px) for float precision issues
    this.canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
  }
}
