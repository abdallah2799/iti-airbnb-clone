import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Camera, Plus, Trash2, MoreHorizontal } from 'lucide-angular';

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './photos.component.html',
})
export class PhotosComponent implements OnInit {
  listingService = inject(ListingCreationService);
  private router = inject(Router);

  readonly icons = { Camera, Plus, Trash2, MoreHorizontal };

  // We store the actual File objects here
  files: File[] = [];
  // We store the preview URLs (base64) here to show in the <img> tags
  previews: string[] = [];

  ngOnInit() {
    // Load existing files if the user went back and returned
    const existingFiles = this.listingService.listingData().photoFiles;
    if (existingFiles && existingFiles.length > 0) {
      this.processFiles(existingFiles);
    }
  }

  // Triggered by the hidden input
  onFileSelected(event: any) {
    const selectedFiles: FileList = event.target.files;
    if (selectedFiles) {
      // Convert FileList to Array
      const fileArray = Array.from(selectedFiles);
      this.processFiles(fileArray);
    }
  }

  // Triggered by Drag & Drop
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const fileArray = Array.from(event.dataTransfer.files);
      this.processFiles(fileArray);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
  }

  // Helper to read files and generate previews
  private processFiles(newFiles: File[]) {
    // Validate images only
    const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));

    this.files = [...this.files, ...validFiles];

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    // Update the backpack
    this.listingService.updateListing({ photoFiles: this.files });
  }

  removePhoto(index: number) {
    this.files.splice(index, 1);
    this.previews.splice(index, 1);
    this.listingService.updateListing({ photoFiles: this.files });
  }

  onNext() {
    // Airbnb usually requires 5, but for testing we check > 0
    if (this.files.length > 0) {
      this.router.navigate(['/hosting/publish']);
    }
  }
}
