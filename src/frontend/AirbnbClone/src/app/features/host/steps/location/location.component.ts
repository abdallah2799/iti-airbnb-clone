import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './location.component.html',
})
export class LocationComponent {
  private listingService = inject(ListingCreationService);
  private router = inject(Router);

  // Initialize with existing data (so it persists if they go back)
  address = this.listingService.listingData().address;
  city = this.listingService.listingData().city;
  country = this.listingService.listingData().country;

  // Validation helper
  isValid(): boolean {
    return !!this.address?.trim() && !!this.city?.trim() && !!this.country?.trim();
  }

  onNext() {
    if (this.isValid()) {
      this.listingService.updateListing({
        address: this.address,
        city: this.city,
        country: this.country,
      });
      // Navigate to Price
      this.router.navigate(['/become-a-host/price']);
    }
  }
}
