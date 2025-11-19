import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HostService } from '../../services/host.service';
import { ListingDetailsDto, ListingStatus } from '../../models/listing-details.model';
import { LucideAngularModule, Loader2, Plus } from 'lucide-angular';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './my-listings.component.html',
})
export class MyListingsComponent implements OnInit {
  private hostService = inject(HostService);

  // Signals for state management
  listings = signal<ListingDetailsDto[]>([]);
  isLoading = signal<boolean>(true);

  // Expose Enum to template
  ListingStatus = ListingStatus;

  readonly icons = { Loader2, Plus };

  ngOnInit() {
    this.loadListings();
  }

  loadListings() {
    this.hostService.getMyListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching listings:', err);
        this.isLoading.set(false);
      },
    });
  }

  // Helper to find the cover photo URL
  getCoverPhoto(listing: ListingDetailsDto): string | null {
    if (!listing.photos || listing.photos.length === 0) return null;

    // Try to find explicit cover, otherwise take first photo
    const cover = listing.photos.find((p) => p.isCover) || listing.photos[0];
    return cover.url;
  }
}
