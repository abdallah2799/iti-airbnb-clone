import { Component, HostListener, Output, EventEmitter } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-search-bar',
  imports: [LucideAngularModule, FormsModule, CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent {
  searchData = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
  };

  // 1. Create Output Event
  @Output() searchTriggered = new EventEmitter<string>();

  search() {
    console.log('Searching with data:', this.searchData);

    // 2. Emit the location string
    if (this.searchData.location) {
      this.searchTriggered.emit(this.searchData.location);
    }

    this.closeAllFields();
  }

  activeField: string | null = null;

  popularDestinations = [
    { name: 'Rome', country: 'Italy', icon: '🏛️' },
    { name: 'Paris', country: 'France', icon: '🗼' },
    { name: 'Tokyo', country: 'Japan', icon: '🗾' },
    { name: 'New York', country: 'USA', icon: '🗽' },
    { name: 'Bali', country: 'Indonesia', icon: '🏝️' },
  ];

  guestOptions = [
    { type: 'Adults', description: 'Ages 13 or above', count: 0 },
    { type: 'Children', description: 'Ages 2-12', count: 0 },
    { type: 'Infants', description: 'Under 2', count: 0 },
    { type: 'Pets', description: 'Service animals', count: 0 },
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdowns when clicking outside
    if (!(event.target as Element).closest('.relative')) {
      this.closeAllFields();
    }
  }

  setActiveField(field: string) {
    this.activeField = this.activeField === field ? null : field;
  }

  closeAllFields() {
    this.activeField = null;
  }

  selectDestination(destination: string) {
    this.searchData.location = destination;
    this.closeAllFields();
  }

  updateGuestCount(type: string, increment: boolean) {
    const option = this.guestOptions.find((opt) => opt.type === type);
    if (option) {
      if (increment) {
        option.count++;
      } else if (option.count > 0) {
        option.count--;
      }
      this.updateTotalGuests();
    }
  }

  updateTotalGuests() {
    const total = this.guestOptions.reduce((sum, option) => sum + option.count, 0);
    this.searchData.guests = total;
  }

  getGuestText(): string {
    const total = this.searchData.guests;
    if (total === 0) return '';
    return total === 1 ? '1 guest' : `${total} guests`;
  }

  // search() {
  //   console.log('Searching with data:', this.searchData);
  //   // Implement search logic here
  //   this.closeAllFields();
  // }
}
