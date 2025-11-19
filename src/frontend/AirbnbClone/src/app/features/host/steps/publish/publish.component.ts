import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './publish.component.html',
})
export class PublishComponent {
  listingService = inject(ListingCreationService);
  private router = inject(Router);

  listing = this.listingService.listingData;
  isSubmitting = false;

  onPublish() {
    this.isSubmitting = true;

    this.listingService.createListing().subscribe({
      next: (response: any) => {
        console.log('Listing created:', response);

        // 1. Reset the wizard data
        this.listingService.reset();

        // 2. Show Success Message (Simple alert for now)
        // In a real app, you'd use a Toast service here like toastr.success()
        alert('🎉 Listing Published Successfully! You can now upload photos from your dashboard.');

        // 3. Redirect to the Hosting Dashboard (The first page we built)
        // This page exists and works!
        this.router.navigate(['/become-a-host']);
      },
      error: (err: any) => {
        console.error('Error creating listing:', err);
        this.isSubmitting = false;
        alert('Failed to create listing. Please check your inputs.');
      },
    });
  }
}
