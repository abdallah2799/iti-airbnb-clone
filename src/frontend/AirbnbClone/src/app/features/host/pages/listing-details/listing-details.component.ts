import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HostService } from '../../services/host.service';
import { ListingDetailsDto, ListingStatus } from '../../models/listing-details.model';
import {
  LucideAngularModule,
  ChevronLeft,
  Edit2,
  MapPin,
  Home,
  Users,
  Bed,
  Bath,
} from 'lucide-angular';

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './listing-details.component.html',
})
export class ListingDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hostService = inject(HostService);

  listing = signal<ListingDetailsDto | null>(null);
  isLoading = signal<boolean>(true);
  isPhotosModalOpen = signal<boolean>(false);

  // Icons
  readonly icons = { ChevronLeft, Edit2, MapPin, Home, Users, Bed, Bath };
  ListingStatus = ListingStatus;

  ngOnInit() {
    // Get ID from URL
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadListing(id);
    }
  }

  loadListing(id: number) {
    this.hostService.getListingById(id).subscribe({
      next: (data) => {
        this.listing.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.router.navigate(['/my-listings']); // Redirect back on error
      },
    });
  }

  // Helper to get main photo
  getCoverPhoto(): string {
    const photos = this.listing()?.photos;
    if (!photos || photos.length === 0) return '';
    return (photos.find((p) => p.isCover) || photos[0]).url;
  }
}
