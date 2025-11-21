import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HostService } from '../../services/host.service';

import {
  ListingDetailsDto,
  ListingStatus,
  PhotoDto,
  BookingStatus,
} from '../../models/listing-details.model';
import {
  LucideAngularModule,
  ChevronLeft,
  Edit2,
  MapPin,
  Home,
  Users,
  Bed,
  Bath,
  X,
  Trash2,
  Plus,
  Upload,
  Star,
} from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

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
  private toastr = inject(ToastrService);
  selectedPhoto = signal<PhotoDto | null>(null);

  listing = signal<ListingDetailsDto | null>(null);
  isLoading = signal<boolean>(true);
  isPhotoModalOpen = signal<boolean>(false);
  BookingStatus = BookingStatus;
  // Icons
  readonly icons = {
    ChevronLeft,
    Edit2,
    MapPin,
    Home,
    Users,
    Bed,
    Bath,
    X,
    Trash2,
    Plus,
    Upload,
    Star,
  };
  ListingStatus = ListingStatus;
  isUploading = signal<boolean>(false);

  mainPhoto = computed(() => {
    const photos = this.listing()?.photos;
    if (!photos?.length) return null;
    return photos.find((p) => p.isCover) || photos[0];
  });

  sidePhotos = computed(() => {
    const main = this.mainPhoto();
    const photos = this.listing()?.photos;
    if (!photos || !main) return [];

    return photos.filter((p) => p.id !== main.id).slice(0, 4);
  });

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

  openPhotoModal() {
    this.isPhotoModalOpen.set(true);
    // Optional: Prevent background scrolling
    document.body.style.overflow = 'hidden';
  }

  closePhotoModal() {
    this.isPhotoModalOpen.set(false);
    // Restore scrolling
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file || !this.listing()) return;

    this.isUploading.set(true);
    const listingId = this.listing()!.id;

    this.hostService.uploadPhoto(listingId, file).subscribe({
      next: (updatedPhotos) => {
        // Update the local signal with the new list of photos
        this.listing.update((current) => (current ? { ...current, photos: updatedPhotos } : null));
        this.toastr.success('Photo uploaded successfully');
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to upload photo');
        this.isUploading.set(false);
      },
    });
  }

  deletePhoto(photoId: number, event?: Event) {
    event?.stopPropagation();

    if (!confirm('Are you sure you want to delete this photo?')) return;

    const listingId = this.listing()!.id;

    this.hostService.deletePhoto(listingId, photoId).subscribe({
      next: () => {
        this.listing.update((current) => {
          if (!current) return null;
          return {
            ...current,
            photos: current.photos.filter((p) => p.id !== photoId),
          };
        });
        this.toastr.success('Photo deleted');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to delete photo');
      },
    });
  }

  viewPhotoDetails(photoId: number) {
    const listingId = this.listing()!.id;

    this.hostService.getPhotoById(listingId, photoId).subscribe({
      next: (photo) => {
        console.log('Fetched single photo:', photo);
        this.selectedPhoto.set(photo);
        document.body.style.overflow = 'hidden';
      },
      error: (err) => console.error(err),
    });
  }

  closeLightbox() {
    this.selectedPhoto.set(null);
    // Only unlock scroll if the grid modal isn't also open
    if (!this.isPhotoModalOpen()) {
      document.body.style.overflow = 'auto';
    }
  }

  deleteListing() {
    const id = this.listing()?.id;
    if (!id) return;

    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      return;
    }
    this.hostService.deleteListing(id).subscribe({
      next: () => {
        this.toastr.success('Listing deleted successfully');
        this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to delete listing');
      },
    });
  }

  // Helper to get main photo
  getCoverPhoto(): string {
    const photos = this.listing()?.photos;
    if (!photos || photos.length === 0) return '';
    return (photos.find((p) => p.isCover) || photos[0]).url;
  }

  setCover(photoId: number) {
    const listingId = this.listing()!.id;

    this.hostService.setCoverPhoto(listingId, photoId).subscribe({
      next: () => {
        // 1. Update the main listing signal (Swap the isCover flags)
        this.listing.update((current) => {
          if (!current) return null;

          const updatedPhotos = current.photos.map((p) => ({
            ...p,
            isCover: p.id === photoId, // Set TRUE for target, FALSE for others
          }));

          return { ...current, photos: updatedPhotos };
        });

        // 2. Update the currently open selectedPhoto signal
        this.selectedPhoto.update((current) => (current ? { ...current, isCover: true } : null));

        this.toastr.success('Cover photo updated successfully');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to set cover photo');
      },
    });
  }

  // Helper to get status text/color
  getBookingStatusBadge(status: BookingStatus) {
    switch (status) {
      case BookingStatus.Confirmed:
        return { label: 'Confirmed', class: 'bg-green-100 text-green-800' };
      case BookingStatus.Pending:
        return { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
      case BookingStatus.Cancelled:
        return { label: 'Cancelled', class: 'bg-red-100 text-red-800' };
      case BookingStatus.Completed:
        return { label: 'Completed', class: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Unknown', class: 'bg-gray-100' };
    }
  }

  averageRating = computed(() => {
    const reviews = this.listing()?.reviews;
    if (!reviews || reviews.length === 0) return 0;

    const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (total / reviews.length).toFixed(2); // Returns string like "4.50"
  });
}
