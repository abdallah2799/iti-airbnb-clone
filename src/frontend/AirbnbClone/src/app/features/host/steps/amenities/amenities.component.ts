import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { HostService } from '../../services/host.service';
import { Amenity } from '../../models/listing.model';
import {
  LucideAngularModule,
  Wifi,
  Tv,
  ChefHat,
  WashingMachine,
  Car,
  CircleDollarSign,
  Snowflake,
  Monitor,
  Siren,
  BriefcaseMedical,
  Flame,
  Wind,
  Waves,
  Bath,
  Sun,
  Utensils,
  Tent,
  Gamepad2,
  Music,
} from 'lucide-angular';

interface AmenitySection {
  categoryKey: string; // Matches the DB 'Category' string
  title: string; // The question to display
}

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './amenities.component.html',
})
export class AmenitiesComponent implements OnInit {
  private listingService = inject(ListingCreationService);
  private hostService = inject(HostService);
  private router = inject(Router);

  // Map backend icon names to Lucide icons
  // Note: You might need to adjust these keys based on exactly what strings you seeded in DB
  readonly icons: any = {
    wifi: Wifi,
    tv: Tv,
    'chef-hat': ChefHat, // Kitchen
    'washing-machine': WashingMachine,
    car: Car,
    'circle-dollar-sign': CircleDollarSign, // Paid parking
    snowflake: Snowflake, // AC
    monitor: Monitor, // Workspace
    siren: Siren, // Smoke alarm
    'briefcase-medical': BriefcaseMedical, // First aid
    flame: Flame, // Fire ext / Fireplace
    wind: Wind, // CO alarm
    waves: Waves, // Pool
    bath: Bath, // Hot tub
    sun: Sun, // Patio
    utensils: Utensils, // BBQ
    tent: Tent, // Outdoor dining
    'gamepad-2': Gamepad2, // Pool table
    music: Music, // Piano
  };

  amenities = signal<Amenity[]>([]);
  selectedIds = signal<number[]>([]);

  sections: AmenitySection[] = [
    {
      categoryKey: 'Essentials',
      title: 'What about these guest favorites?',
    },
    {
      categoryKey: 'Standout',
      title: 'Do you have any standout amenities?',
    },
    {
      categoryKey: 'Safety',
      title: 'Do you have any of these safety items?',
    },
  ];

  ngOnInit() {
    // 1. Load saved selection from backpack
    this.selectedIds.set(this.listingService.listingData().amenityIds || []);

    // 2. Fetch available options from API
    this.hostService.getAmenities().subscribe((data) => {
      this.amenities.set(data);
    });
  }

  toggleAmenity(id: number) {
    this.selectedIds.update((current) => {
      if (current.includes(id)) {
        // Remove it
        return current.filter((x) => x !== id);
      } else {
        // Add it
        return [...current, id];
      }
    });

    // Save to backpack immediately
    this.listingService.updateListing({ amenityIds: this.selectedIds() });
  }

  getAmenitiesByCategory(category: string): Amenity[] {
    return this.amenities().filter((a) => a.category === category);
  }

  onNext() {
    this.router.navigate(['/hosting/location']);
  }

  // Wrapper for Save & Exit
  onSaveExit() {
    this.listingService.updateListing({ amenityIds: this.selectedIds() });
    this.listingService.saveAndExit();
  }
}
