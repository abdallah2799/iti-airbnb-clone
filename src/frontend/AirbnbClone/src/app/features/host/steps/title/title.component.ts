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
  private listingService = inject(ListingCreationService);
  private router = inject(Router);

  title = this.listingService.listingData().title;

  onNext() {
    if (this.title?.trim()) {
      this.listingService.updateListing({ title: this.title });
      this.router.navigate(['/become-a-host/description']);
    }
  }
}
