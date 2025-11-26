import { Component, HostListener, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ListingService,
  LocationOption,
} from '../../../features/listings/services/listing.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent {
  searchData = {
export class SearchBarComponent implements OnInit {
  private listingService = inject(ListingService);
  private router = inject(Router);
hoverField: string | null = null;

  searchData = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
  };

  // 1. Create Output Event
  @Output() searchTriggered = new EventEmitter<string>();

  searchMap() {
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
  // Dynamic locations from database
  availableLocations: LocationOption[] = [];
  filteredLocations: LocationOption[] = [];
  isLoadingLocations = false;

  // Search input subject for debouncing
  private locationSearchSubject = new Subject<string>();

  guestOptions = [
    { type: 'Adults', description: 'Ages 13 or above', count: 0 },
    { type: 'Children', description: 'Ages 2-12', count: 0 },
    { type: 'Infants', description: 'Under 2', count: 0 },
    { type: 'Pets', description: 'Service animals', count: 0 },
  ];

  ngOnInit(): void {
    // Load all locations on component init
    this.loadLocations();

    // Setup search debouncing
    this.locationSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchLocations(searchTerm);
      });
  }

  loadLocations(): void {
    this.isLoadingLocations = true;
    this.listingService.getUniqueLocations().subscribe({
      next: (locations) => {
        this.availableLocations = locations;
        this.filteredLocations = locations;
        this.isLoadingLocations = false;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.isLoadingLocations = false;
      },
    });
  }

  searchLocations(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredLocations = this.availableLocations;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredLocations = this.availableLocations.filter(
      (loc) => loc.city.toLowerCase().includes(term) || loc.country.toLowerCase().includes(term)
    );
  }

  onLocationSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.locationSearchSubject.next(value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
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

  selectDestination(location: LocationOption) {
    this.searchData.location = `${location.city}, ${location.country}`;
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

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getGuestText(): string {
    const total = this.searchData.guests;
    if (total === 0) return '';
    return total === 1 ? '1 guest' : `${total} guests`;
  }

  search() {
    console.log('Searching with data:', this.searchData);
    
    const queryParams: any = {};
    
    if (this.searchData.location) {
      // Extract city name only (remove country)
      const cityMatch = this.searchData.location.split(',')[0].trim();
      queryParams.location = cityMatch;
    }
    
    if (this.searchData.checkIn && this.searchData.checkOut) {
      queryParams.checkIn = this.searchData.checkIn;
      queryParams.checkOut = this.searchData.checkOut;
    }
    
    if (this.searchData.guests > 0) {
      queryParams.guests = this.searchData.guests;
    }

    this.router.navigate(['/search'], { queryParams });
    this.closeAllFields();
  }
}
