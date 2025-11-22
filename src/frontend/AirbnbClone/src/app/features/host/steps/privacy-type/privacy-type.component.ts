import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../../services/listing-creation.service';
import { PrivacyType } from '../../models/listing.model';
import { LucideAngularModule, Home, DoorOpen, Users, LucideIconData } from 'lucide-angular';

// 1. Define the specific icon names for this step
type IconName = 'Home' | 'DoorOpen' | 'Users';

interface PrivacyOption {
  label: string;
  description: string;
  value: PrivacyType;
  iconName: IconName;
}

@Component({
  selector: 'app-privacy-type',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './privacy-type.component.html',
})
export class PrivacyTypeComponent {
  public listingService = inject(ListingCreationService);
  private router = inject(Router);

  // 2. Create the mapping object exactly like you did in StructureComponent
  readonly icons: Record<IconName, LucideIconData> = {
    Home,
    DoorOpen,
    Users,
  };

  currentPrivacyType = this.listingService.listingData().privacyType;

  // 3. Define options with descriptions
  privacyOptions: PrivacyOption[] = [
    {
      label: 'An entire place',
      description: 'Guests have the whole place to themselves.',
      value: PrivacyType.EntirePlace,
      iconName: 'Home',
    },
    {
      label: 'A room',
      description: 'Guests have their own room in a home, plus access to shared spaces.',
      value: PrivacyType.Room,
      iconName: 'DoorOpen',
    },
    {
      label: 'A shared room',
      description: 'Guests sleep in a room or common area that may be shared with others.',
      value: PrivacyType.SharedRoom,
      iconName: 'Users',
    },
  ];

  onSelect(type: PrivacyType) {
    this.currentPrivacyType = type;
    this.listingService.updateListing({ privacyType: type });
  }

  onNext() {
    if (this.currentPrivacyType !== null) {
      this.router.navigate(['/hosting/location']);
    }
  }
}
