import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { PropertyType } from '../../models/listing.model';
import {
  LucideAngularModule,
  Home,
  Building2,
  Palmtree,
  Tent,
  Bed,
  LucideIconData,
} from 'lucide-angular';

type IconName = 'Home' | 'Building2' | 'Palmtree' | 'Tent' | 'Bed';

interface PropertyOption {
  label: string;
  value: PropertyType;
  iconName: IconName;
}

@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './structure.component.html',
})
export class StructureComponent {
  private listingService = inject(ListingCreationService);
  private router = inject(Router);

  // Properly typed icon map
  readonly icons: Record<IconName, LucideIconData> = {
    Home,
    Building2,
    Palmtree,
    Tent,
    Bed,
  };

  currentPropertyType = this.listingService.listingData().propertyType;

  propertyOptions: PropertyOption[] = [
    { label: 'House', value: PropertyType.House, iconName: 'Home' },
    { label: 'Apartment', value: PropertyType.Apartment, iconName: 'Building2' },
    { label: 'Villa', value: PropertyType.Villa, iconName: 'Palmtree' },
    { label: 'Cabin', value: PropertyType.Cabin, iconName: 'Tent' },
    { label: 'Room', value: PropertyType.Room, iconName: 'Bed' },
  ];

  onSelect(type: PropertyType) {
    this.currentPropertyType = type;
    this.listingService.updateListing({ propertyType: type });
  }

  onNext() {
    if (this.currentPropertyType !== null) {
      this.listingService.updateListing({ propertyType: this.currentPropertyType });
      this.router.navigate(['/hosting/privacy-type']);
    }
  }
}
