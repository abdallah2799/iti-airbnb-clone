import { Component, HostListener, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // Added ActivatedRoute
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
// Assuming ListingService is where getUniqueLocations is defined
import {
  ListingService,
  LocationOption,
} from '../../../features/listings/services/listing.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent implements OnInit {
  private listingService = inject(ListingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // To check current URL

  // 1. Output Event (For Map Page to listen to)
  @Output() searchTriggered = new EventEmitter<string>();

  searchData = {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
  };

  activeField: string | null = null;
  hoverField: string | null = null;

  // Location Data
  availableLocations: LocationOption[] = [];
  filteredLocations: LocationOption[] = [];
  isLoadingLocations = false;
  private locationSearchSubject = new Subject<string>();

  guestOptions = [
    { type: 'Adults', description: 'Ages 13 or above', count: 0 },
    { type: 'Children', description: 'Ages 2-12', count: 0 },
    { type: 'Infants', description: 'Under 2', count: 0 },
    { type: 'Pets', description: 'Service animals', count: 0 },
  ];

  ngOnInit(): void {
    this.loadLocations();

    this.locationSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchLocations(searchTerm);
      });

    // Optional: Pre-fill search bar if URL has params
    this.route.queryParams.subscribe((params) => {
      if (params['location']) this.searchData.location = params['location'];
    });
  }

  loadLocations(): void {
    this.isLoadingLocations = true;
    // Ensure this service method exists in your teammate's code!
    this.listingService.getUniqueLocations().subscribe({
      next: (locations) => {
        this.availableLocations = locations;
        this.filteredLocations = locations;
        this.isLoadingLocations = false;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.isLoadingLocations = false;
        // Fallback to popular if API fails
        this.filteredLocations = [];
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

  // Handle selection from dynamic list
  selectDestination(location: LocationOption) {
    this.searchData.location = `${location.city}, ${location.country}`;
    this.closeAllFields();
  }

  // Handle selection from static popular list
  selectPopularDestination(name: string, country: string) {
    this.searchData.location = `${name}, ${country}`;
    this.closeAllFields();
  }

  updateGuestCount(type: string, increment: boolean) {
    const option = this.guestOptions.find((opt) => opt.type === type);
    if (option) {
      if (increment) option.count++;
      else if (option.count > 0) option.count--;
      this.updateTotalGuests();
    }
  }

  updateTotalGuests() {
    this.searchData.guests = this.guestOptions.reduce((sum, option) => sum + option.count, 0);
  }

  getGuestText(): string {
    const total = this.searchData.guests;
    if (total === 0) return '';
    return total === 1 ? '1 guest' : `${total} guests`;
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // --- THE UNIFIED SEARCH METHOD ---
  search() {
    console.log('Searching...', this.searchData);
    const location = this.searchData.location;

    // 1. Always emit the event (For Map Page to update without reload)
    if (location) {
      this.searchTriggered.emit(location);
    }

    // 2. Decide: Are we already on the search page?
    const isSearchPage = this.router.url.startsWith('/search');

    if (!isSearchPage) {
      // If on Home Page, Navigate!
      const queryParams: any = {};
      if (location) queryParams.location = location.split(',')[0].trim(); // Extract City
      if (this.searchData.guests > 0) queryParams.guests = this.searchData.guests;

      this.router.navigate(['/search'], { queryParams });
    } else {
      // If already on Search Page, updating the URL params is enough
      // The SearchPageComponent listens to route changes in ngOnInit
      const queryParams: any = {};
      if (location) queryParams.location = location.split(',')[0].trim();

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge', // Merge with existing params
      });
    }

    this.closeAllFields();
  }
}
