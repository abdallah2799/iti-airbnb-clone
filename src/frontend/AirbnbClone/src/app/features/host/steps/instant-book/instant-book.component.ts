import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, CalendarCheck, Zap, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-instant-book',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './instant-book.component.html',
})
export class InstantBookComponent {
  private listingService = inject(ListingCreationService);
  private router = inject(Router);

  readonly icons: Record<string, LucideIconData> = { CalendarCheck, Zap };

  // Default to false (Manual approval / "Approve your first 5")
  instantBooking = this.listingService.listingData().instantBooking;

  onSelect(isInstant: boolean) {
    this.instantBooking = isInstant;
    this.listingService.updateListing({ instantBooking: isInstant });
  }

  onNext() {
    this.listingService.updateListing({ instantBooking: this.instantBooking });
    // This route will work once we create the Title component below
    this.router.navigate(['/hosting/title']);
  }
}
