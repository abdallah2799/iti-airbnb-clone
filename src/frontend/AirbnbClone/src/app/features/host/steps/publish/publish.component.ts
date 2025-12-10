import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Loader2 } from 'lucide-angular';
import { HostService } from '../../services/host.service';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './publish.component.html',
})
export class PublishComponent implements OnInit {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private hostService = inject(HostService); // Ensure HostService is injected

  readonly icons = { Loader2 };

  listing = this.listingService.listingData;
  isSubmitting = false;
  coverPhotoPreview: string | null = null;

  ngOnInit() {
    const listing = this.listingService.listingData();
    const localFiles = listing.photoFiles;

    // 1. Check Server Photos First (They are the source of truth for "Cover")
    if (listing.id) {
      this.hostService.getListingById(listing.id).subscribe((details) => {
        if (details.photos && details.photos.length > 0) {
          // Find the explicitly marked cover
          const cover = details.photos.find((p) => p.isCover) || details.photos[0];
          this.coverPhotoPreview = cover.url;
        }
        // If no server photos, check local files
        else if (localFiles && localFiles.length > 0) {
          this.readLocalFile(localFiles[0]);
        }
      });
    }
    // 2. If no ID (Brand new listing), check local files
    else if (localFiles && localFiles.length > 0) {
      this.readLocalFile(localFiles[0]);
    }
  }

  // Helper to avoid code duplication
  private readLocalFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.coverPhotoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onPublish() {
    this.isSubmitting = true;

    this.listingService.createListingAndUpload().subscribe({
      next: (response: any) => {
        console.log('Listing and Photos processed:', response);

        this.toastr.success('Your listing is now under review by an admin.', 'Submitted for Review! 📝', {
          timeOut: 5000,
          progressBar: true,
        });

        this.listingService.reset();
        this.router.navigate(['/my-listings']);
      },
      error: (err: any) => {
        console.error('Error creating listing:', err);

        this.isSubmitting = false;

        this.toastr.error(
          err.error?.message || 'Please check your inputs and try again.',
          'Failed to publish'
        );
      },
    });
  }
}
