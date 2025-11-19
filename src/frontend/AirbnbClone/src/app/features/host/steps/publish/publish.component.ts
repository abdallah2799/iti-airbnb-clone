import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule], // Add Lucide
  templateUrl: './publish.component.html',
})
export class PublishComponent implements OnInit {
  private listingService = inject(ListingCreationService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  readonly icons = { Loader2 };

  listing = this.listingService.listingData;
  isSubmitting = false;
  coverPhotoPreview: string | null = null;

  ngOnInit() {
    const files = this.listing().photoFiles;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverPhotoPreview = e.target.result;
      };
      reader.readAsDataURL(files[0]);
    }
  }

  onPublish() {
    this.isSubmitting = true;

    this.listingService.createListingAndUpload().subscribe({
      next: (response: any) => {
        console.log('Listing and Photos processed:', response);

        this.toastr.success('You can now see it in your dashboard.', 'Listing Published! 🎉', {
          timeOut: 5000,
          progressBar: true,
        });

        this.listingService.reset();
        this.router.navigate(['/become-a-host']);
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
