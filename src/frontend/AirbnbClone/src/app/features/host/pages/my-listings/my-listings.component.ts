import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostService } from '../../services/host.service';
import { ListingDetailsDto, ListingStatus } from '../../models/listing-details.model';
import { LucideAngularModule, Loader2, Plus } from 'lucide-angular';
import { ListingCreationService } from '../../services/listing-creation.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './my-listings.component.html',
})
export class MyListingsComponent implements OnInit {
  constructor(private router: Router) {}

  private hostService = inject(HostService);

  // Inject ListingCreationService
  private creationService = inject(ListingCreationService);

  onFinishListing(listing: ListingDetailsDto) {
    // 1. Load data into the backpack
    this.creationService.loadDraft(listing);

    // 2. Navigate to the first step (or determine which step was left off)
    this.router.navigate(['/hosting/structure']);
  }

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

  getStatusClass(status: ListingStatus): string {
    switch (status) {
      case ListingStatus.Published:
        return 'bg-green-100 text-green-800';
      case ListingStatus.Inactive:
        return 'bg-yellow-100 text-yellow-800';
      case ListingStatus.Suspended:
        return 'bg-red-100 text-red-800';
      case ListingStatus.UnderReview:
        return 'bg-blue-100 text-blue-800';
      case ListingStatus.Draft:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: ListingStatus): string {
    switch (status) {
      case ListingStatus.Published:
        return 'Published';
      case ListingStatus.Inactive:
        return 'Inactive';
      case ListingStatus.Suspended:
        return 'Suspended';
      case ListingStatus.UnderReview:
        return 'Under Review';
      case ListingStatus.Draft:
      default:
        return 'Draft';
    }
  }

  // Helper to find the cover photo URL
  getCoverPhoto(listing: ListingDetailsDto): string | null {
    if (!listing.photos || listing.photos.length === 0) return null;

    // Try to find explicit cover, otherwise take first photo
    const cover = listing.photos.find((p) => p.isCover) || listing.photos[0];
    return cover.url;
  }
}
