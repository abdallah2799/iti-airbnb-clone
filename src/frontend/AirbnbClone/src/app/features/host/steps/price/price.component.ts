import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './price.component.html',
})
export class PriceComponent {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);

  readonly icons = { Minus, Plus };

  // Initialize with existing data or default to $50
  price = this.listingService.listingData().pricePerNight || 50;

  // Helper to adjust price
  adjustPrice(amount: number) {
    this.price += amount;
    if (this.price < 10) this.price = 10; // Minimum price constraint
  }

  // Ensure only numbers are typed
  validateInput(event: any) {
    const pattern = /[0-9]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  onSaveExit() {
    this.listingService.updateListing({ pricePerNight: this.price });
    this.listingService.saveAndExit();
  }

  onNext() {
    if (this.price > 0) {
      this.listingService.updateListing({ pricePerNight: this.price });
      // Navigate to Instant Book
      this.router.navigate(['/hosting/title']);
    }
  }
}
