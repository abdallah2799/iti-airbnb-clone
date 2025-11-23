import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HostService } from '../../services/host.service';
// 1. Import PrivacyType
import { UpdateListingDto, PropertyType, PrivacyType } from '../../models/listing.model';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, ChevronLeft, Save, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-listing.component.html',
})
export class EditListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hostService = inject(HostService);
  private toastr = inject(ToastrService);

  readonly icons = { ChevronLeft, Save, Loader2 };

  listingId: number = 0;
  isLoading = true;
  isSaving = false;

  // 2. Initialize formData with PrivacyType
  formData: UpdateListingDto = {
    title: '',
    description: '',
    pricePerNight: 0,
    address: '',
    city: '',
    country: '',
    maxGuests: 1,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    propertyType: PropertyType.House,
    privacyType: PrivacyType.EntirePlace, // Default
    instantBooking: false,
  };

  propertyTypes = [
    { value: PropertyType.Apartment, label: 'Apartment' },
    { value: PropertyType.House, label: 'House' },
    { value: PropertyType.Villa, label: 'Villa' },
    { value: PropertyType.Cabin, label: 'Cabin' },
    { value: PropertyType.Room, label: 'Room' },
  ];

  // 3. Add Privacy Options
  privacyTypes = [
    { value: PrivacyType.EntirePlace, label: 'Entire place' },
    { value: PrivacyType.Room, label: 'Private room' },
    { value: PrivacyType.SharedRoom, label: 'Shared room' },
  ];

  ngOnInit() {
    this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.listingId) {
      this.loadListing();
    }
  }

  loadListing() {
    this.hostService.getListingById(this.listingId).subscribe({
      next: (data) => {
        // 4. Map API response to Form Data
        this.formData = {
          title: data.title,
          description: data.description,
          pricePerNight: data.pricePerNight,
          address: data.address,
          city: data.city,
          country: data.country,
          maxGuests: data.maxGuests,
          numberOfBedrooms: data.numberOfBedrooms,
          numberOfBathrooms: data.numberOfBathrooms,
          propertyType: data.propertyType,
          privacyType: data.privacyType, // Added
          instantBooking: false,
          // Removed cleaningFee and minimumNights as requested
        };
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Could not load listing');
        this.router.navigate(['/my-listings']);
      },
    });
  }

  onSave() {
    this.isSaving = true;
    this.hostService.updateListing(this.listingId, this.formData).subscribe({
      next: () => {
        this.toastr.success('Listing updated successfully');
        this.router.navigate(['/my-listings', this.listingId]);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update listing');
        this.isSaving = false;
      },
    });
  }
}
