import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';

@Component({
  selector: 'app-description',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './description.component.html',
})
export class DescriptionComponent {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);

  description = this.listingService.listingData().description;

  onSaveExit() {
    this.listingService.updateListing({ description: this.description });
    this.listingService.saveAndExit();
  }

  onNext() {
    if (this.description?.trim()) {
      this.listingService.updateListing({ description: this.description });
      // Go to FINAL step: Publish
      this.router.navigate(['/hosting/photos']);
    }
  }
}
