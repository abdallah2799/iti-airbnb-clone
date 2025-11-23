import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { LucideAngularModule, Camera, Plus, Trash2, MoreHorizontal } from 'lucide-angular';
import { PhotoDto } from '../../models/listing-details.model';
import { HostService } from '../../services/host.service';

interface DisplayPhoto {
  url: string;
  isServer: boolean;
  id?: number; // Only for server photos
  fileIndex?: number; // Only for local files
}

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './photos.component.html',
})
export class PhotosComponent implements OnInit {
  listingService = inject(ListingCreationService);
  private router = inject(Router);
  private hostService = inject(HostService);
  readonly icons = { Camera, Plus, Trash2, MoreHorizontal };

  serverPhotos: PhotoDto[] = [];
  localFiles: File[] = [];

  // The Unified List for the UI
  displayPhotos: DisplayPhoto[] = [];

  ngOnInit() {
    const listingId = this.listingService.listingData().id;

    // 1. Load Server Photos
    if (listingId) {
      this.hostService.getListingById(listingId).subscribe((details) => {
        this.serverPhotos = details.photos || [];
        this.updateDisplayList(); // Refresh UI
      });
    }

    // 2. Load Local Photos (if user went back and forth)
    const existingFiles = this.listingService.listingData().photoFiles;
    if (existingFiles && existingFiles.length > 0) {
      this.processFiles(existingFiles);
    } else {
      this.updateDisplayList(); // Init empty state
    }
  }

  onFileSelected(event: any) {
    const selectedFiles: FileList = event.target.files;
    if (selectedFiles) {
      this.processFiles(Array.from(selectedFiles));
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private processFiles(newFiles: File[]) {
    const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));
    this.localFiles = [...this.localFiles, ...validFiles];

    // Update Service
    this.listingService.updateListing({ photoFiles: this.localFiles });

    // Update UI
    this.updateDisplayList();
  }

  // --- THE MAGIC: Merge Everything ---
  private updateDisplayList() {
    this.displayPhotos = [];

    // 1. Add Server Photos
    this.serverPhotos.forEach((p) => {
      this.displayPhotos.push({ url: p.url, isServer: true, id: p.id });
    });

    // 2. Add Local Photos (Need to read them to get URL)
    this.localFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Push to display list (We can't guarantee order here due to async reading,
        // but for simplicity in this MVP it's okay. For strict order, use Promise.all)
        // Ideally, we store the preview URL when we first read the file.
      };
      // Simpler approach for this fix: Just rebuild the array with what we have
    });

    // Better Approach for Local Previews:
    // We will rebuild displayPhotos by mapping localFiles to object URLs
    const localDisplay = this.localFiles.map((file, index) => ({
      url: URL.createObjectURL(file), // Instant preview!
      isServer: false,
      fileIndex: index,
    }));

    this.displayPhotos = [
      ...this.serverPhotos.map((p) => ({ url: p.url, isServer: true, id: p.id })),
      ...localDisplay,
    ];
  }

  // Unified Remove Function
  removePhoto(photo: DisplayPhoto) {
    if (photo.isServer && photo.id) {
      // Call API to delete server photo
      this.removeServerPhoto(photo.id);
    } else if (photo.fileIndex !== undefined) {
      // Remove from local array
      this.localFiles.splice(photo.fileIndex, 1);
      this.listingService.updateListing({ photoFiles: this.localFiles });
      this.updateDisplayList();
    }
  }

  removeServerPhoto(photoId: number) {
    const listingId = this.listingService.listingData().id;
    if (!listingId) return;

    this.hostService.deletePhoto(listingId, photoId).subscribe(() => {
      this.serverPhotos = this.serverPhotos.filter((p) => p.id !== photoId);
      this.updateDisplayList();
    });
  }
  onNext() {
    if (this.displayPhotos.length > 0) {
      this.router.navigate(['/hosting/publish']);
    }
  }
}
