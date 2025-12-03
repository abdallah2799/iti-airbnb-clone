import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-search-pill',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div 
      (click)="onClick()"
      class="flex items-center justify-between border border-gray-300 rounded-full shadow-sm hover:shadow-md cursor-pointer py-0.1 pl-6 pr-2 bg-white transition-all duration-200 min-w-[300px]"
    >
      <div class="flex items-center text-sm">
        <img src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240" class="w-15 h-15 object-contain transition-opacity">
        <span class="font-semibold text-gray-900">Anywhere</span>
      </div>
      
      <div class="h-6 w-[1px] bg-gray-300 mx-4"></div>
      
      <div class="flex flex-col items-start text-sm">
        <span class="font-semibold text-gray-900">Any week</span>
      </div>
      
      <div class="h-6 w-[1px] bg-gray-300 mx-4"></div>
      
      <div class="flex items-center gap-3">
        <span class="font-semibold text-sm text-gray-900">Add guests</span>
        <div class="bg-[#FF385C] p-2 rounded-full text-white">
          <lucide-icon name="search" class="w-4 h-4 stroke-[3px]"></lucide-icon>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class SearchPillComponent {
    @Input() location: string = '';
    @Output() pillClick = new EventEmitter<void>();

    onClick() {
        this.pillClick.emit();
    }
}
