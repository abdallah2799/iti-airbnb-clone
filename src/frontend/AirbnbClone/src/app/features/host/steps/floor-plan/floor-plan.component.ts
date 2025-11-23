import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './floor-plan.component.html',
})
export class FloorPlanComponent {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);

  // Register icons
  readonly icons = { Minus, Plus };

  // Initialize values from the service (backpack)
  // We default to 1 if they haven't been set, except bathrooms which defaults to 1
  guests = this.listingService.listingData().maxGuests || 4;
  bedrooms = this.listingService.listingData().numberOfBedrooms || 1;
  bathrooms = this.listingService.listingData().numberOfBathrooms || 1;

  // Helper to increment/decrement
  updateCount(field: 'guests' | 'bedrooms' | 'bathrooms', operation: 'add' | 'remove') {
    if (field === 'guests') {
      if (operation === 'add') this.guests++;
      else if (this.guests > 1) this.guests--;
    } else if (field === 'bedrooms') {
      if (operation === 'add') this.bedrooms++;
      else if (this.bedrooms > 0) this.bedrooms--; // Bedrooms can be 0 (studio)
    } else if (field === 'bathrooms') {
      if (operation === 'add') this.bathrooms++;
      else if (this.bathrooms > 1) this.bathrooms--; // Usually minimum 1 bathroom
    }

    // Save to service immediately (optional, can also do it onNext)
    this.saveData();
  }

  saveData() {
    this.listingService.updateListing({
      maxGuests: this.guests,
      numberOfBedrooms: this.bedrooms,
      numberOfBathrooms: this.bathrooms,
    });
  }

  onNext() {
    this.saveData();
    this.router.navigate(['/hosting/amenities']); // Updated path
  }
}
