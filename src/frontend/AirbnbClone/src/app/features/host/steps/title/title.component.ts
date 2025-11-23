import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';

@Component({
  selector: 'app-title',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './title.component.html',
})
export class TitleComponent {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);

  title = this.listingService.listingData().title;

  onSaveExit() {
    // 1. Force update the service with current input value
    this.listingService.updateListing({ title: this.title });

    // 2. NOW call save
    this.listingService.saveAndExit();
  }

  onNext() {
    if (this.title?.trim()) {
      this.listingService.updateListing({ title: this.title });
      this.router.navigate(['/hosting/description']);
    }
  }
}
